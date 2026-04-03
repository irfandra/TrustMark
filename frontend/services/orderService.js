import { apiRequest } from './apiClient';
import { DEFAULT_BRAND_ID } from './brandService';

const STATUS_META = {
  PENDING: { section: 'On Shipment', actionLabel: 'Ship', deliveryStatus: 'On Shipment' },
  PAYMENT_RECEIVED: { section: 'On Shipment', actionLabel: 'Ship', deliveryStatus: 'On Shipment' },
  PROCESSING: { section: 'On Shipment', actionLabel: 'Ship', deliveryStatus: 'On Shipment' },
  SHIPPED: { section: 'On Shipment', actionLabel: 'Wait for Claim', deliveryStatus: 'On Shipment' },
  DELIVERED: { section: 'On Shipment', actionLabel: 'Wait for Claim', deliveryStatus: 'On Shipment' },
  COMPLETED: { section: 'Completed', actionLabel: 'View', deliveryStatus: 'Completed' },
  CANCELLED: { section: 'Completed', actionLabel: 'View', deliveryStatus: 'Completed' },
  REFUNDED: { section: 'Completed', actionLabel: 'View', deliveryStatus: 'Completed' },
};

const parsePageContent = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.content)) {
    return value.content;
  }

  return [];
};

const normalizeSerial = (value) =>
  String(value || '')
    .replace(/^#/, '')
    .trim()
    .toUpperCase();

const formatUsd = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '--';
  }

  const hasDecimals = Math.abs(numeric % 1) > 0;
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

const toHandle = (value) => {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  if (!cleaned) {
    return 'Brand';
  }

  return `@${cleaned}`;
};

const shortAddress = (value) => {
  const safeValue = String(value || '').trim();
  if (!safeValue) {
    return 'Unknown';
  }

  if (safeValue.length <= 14) {
    return safeValue;
  }

  return `${safeValue.slice(0, 8)}...${safeValue.slice(-6)}`;
};

const resolveOwnerLabel = (item, fallbackWallet, fallbackRecipientName) => {
  const safeRecipientName = String(fallbackRecipientName || '').trim();
  if (safeRecipientName) {
    return safeRecipientName;
  }

  const buyerWallet = String(fallbackWallet || '').trim();
  if (buyerWallet) {
    return shortAddress(buyerWallet);
  }

  return 'Unknown';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
};

const isProductItemInStock = (item) => {
  const explicitInStock = item?.status ?? item?.inStock ?? item?.isInStock;
  if (typeof explicitInStock === 'boolean') {
    return explicitInStock;
  }

  const stockStatus = String(item?.stockStatus || item?.status || item?.availability || '')
    .trim()
    .toUpperCase();
  if (stockStatus) {
    return stockStatus === 'IN_STOCK';
  }

  const hasSoldOrClaimed = Boolean(item?.shippedAt || item?.claimedAt);
  if (hasSoldOrClaimed) {
    return false;
  }

  return true;
};

const isCollectionActiveForShipping = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  return normalized === 'ACTIVE';
};

const mapOrderCard = (order, product) => {
  const meta = STATUS_META[order?.status] || STATUS_META.PENDING;
  const rawStatus = String(order?.status || '').toUpperCase();
  const isProcessable =
    rawStatus === 'PENDING' || rawStatus === 'PAYMENT_RECEIVED' || rawStatus === 'PROCESSING';
  const canShip = !isProcessable || isCollectionActiveForShipping(product?.collectionStatus);

  return {
    orderId: order.id,
    productItemId: order?.productItemId ?? null,
    orderNumber: order.orderNumber,
    status: meta.section,
    rawStatus: order.status,
    itemId: order.itemSerial || order.orderNumber || String(order.id),
    displayId: `#${order.itemSerial || order.orderNumber || order.id}`,
    itemName: order.productName || product?.productName || 'Unnamed Item',
    collection: product?.collectionName || 'Collection',
    amount: Number(order.totalPrice || 0),
    currency: order?.currency || product?.currency || 'USD',
    actionLabel: canShip ? meta.actionLabel : undefined,
    canShip,
    collectionStatus: product?.collectionStatus || null,
    createdAt: order.createdAt || null,
  };
};

const buildTrackingNumber = (orderId) => {
  const stamp = Date.now().toString().slice(-8);
  return `TRUSTMARK-${orderId}-${stamp}`;
};

const moveOrderToShipment = async (service, orderId, deliveryDetails = {}) => {
  try {
    return await service.shipCreatorOrder(orderId, deliveryDetails);
  } catch (_shipError) {
    await service.processCreatorOrder(orderId);
    return service.shipCreatorOrder(orderId, deliveryDetails);
  }
};

const deriveDelivery = (order, meta) => {
  const status = meta.deliveryStatus;
  const recipientName = order?.recipientName || order?.buyerName || '-';
  const recipientPhone = order?.recipientPhoneNumber || order?.buyerPhoneNumber || '-';
  const estimatedAt = order?.estimatedAt || order?.deliveredAt || null;
  return {
    status,
    claimedTime: formatDate(order?.completedAt),
    arrivalTime: formatDate(estimatedAt || order?.shippedAt),
    estimatedAtRaw: estimatedAt,
    address: order?.shippingAddress || '-',
    trackingNumber: order?.trackingNumber || '-',
    recipientName,
    phone: recipientPhone,
  };
};

const mapInStockItemToShipmentCandidate = (item, product) => ({
  shipmentSource: 'in-stock',
  shipmentKey: `in-stock:${item.id}`,
  productItemId: item.id,
  orderId: null,
  orderNumber: null,
  status: 'In Stock',
  rawStatus: 'IN_STOCK',
  itemId: item.itemSerial || String(item.id),
  displayId: `#${item.itemSerial || item.id}`,
  itemName: item.productName || product?.productName || 'Unnamed Item',
  collection: product?.collectionName || 'Collection',
  amount: Number(product?.price || 0),
  currency: product?.currency || 'USD',
  actionLabel: 'Ship',
  createdAt: item?.createdAt || null,
});

export const orderService = {
  async getCreatorOrders(brandId = DEFAULT_BRAND_ID) {
    const collections = await apiRequest(`/brands/${brandId}/collections`).catch(() => []);
    if (!Array.isArray(collections) || collections.length === 0) {
      return [];
    }

    const groupedProducts = await Promise.all(
      collections.map(async (collection) => {
        const products = await apiRequest(`/collections/${collection.id}/products`).catch(() => []);
        return {
          collection,
          products: Array.isArray(products)
            ? products.map((product) => ({
                ...product,
                collectionStatus: collection?.status || null,
              }))
            : [],
        };
      })
    );

    const flatProducts = groupedProducts.flatMap(({ products }) => products);

    const orderPages = await Promise.all(
      flatProducts.map((product) =>
        apiRequest(`/shipments/product/${product.id}?page=0&size=100`)
          .then((page) => ({ product, orders: parsePageContent(page) }))
          .catch(() => ({ product, orders: [] }))
      )
    );

    return orderPages
      .flatMap(({ product, orders }) =>
        orders.map((order) => mapOrderCard(order, product))
      )
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
  },

  async getCreatorInStockShipmentCandidates(brandId = DEFAULT_BRAND_ID) {
    const collections = await apiRequest(`/brands/${brandId}/collections`).catch(() => []);
    if (!Array.isArray(collections) || collections.length === 0) {
      return [];
    }

    const groupedProducts = await Promise.all(
      collections.map(async (collection) => {
        const products = await apiRequest(`/collections/${collection.id}/products`).catch(() => []);
        return {
          collection,
          products: Array.isArray(products) ? products : [],
        };
      })
    );

    const flatProducts = groupedProducts
      .filter(({ collection }) => isCollectionActiveForShipping(collection?.status))
      .flatMap(({ products }) => products);

    const inStockRows = await Promise.all(
      flatProducts.map(async (product) => {
        const items = await apiRequest(`/products/${product.id}/items`).catch(() => []);
        if (!Array.isArray(items)) {
          return [];
        }

        return items
          .filter((item) => isProductItemInStock(item))
          .map((item) => mapInStockItemToShipmentCandidate(item, product));
      })
    );

    return inStockRows.flat();
  },

  async getCreatorOrderDetail(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    const order = await apiRequest(`/shipments/${orderId}`);

    const [product, items, collections] = await Promise.all([
      apiRequest(`/products/${order.productId}`).catch(() => null),
      apiRequest(`/products/${order.productId}/items`).catch(() => []),
      apiRequest(`/brands/${DEFAULT_BRAND_ID}/collections`).catch(() => []),
    ]);

    const relatedItems = Array.isArray(items) ? items : [];
    const orderItem = relatedItems.find((item) =>
      (order.productItemId != null && item.id === order.productItemId) ||
      (order.itemSerial != null && item.itemSerial === order.itemSerial)
    );

    const statusMeta = STATUS_META[order?.status] || STATUS_META.PENDING;
    const collectionStatus = Array.isArray(collections)
      ? collections.find((collection) => String(collection?.id) === String(product?.collectionId))?.status
      : null;
    const rawStatus = String(order?.status || '').toUpperCase();
    const isProcessable =
      rawStatus === 'PENDING' || rawStatus === 'PAYMENT_RECEIVED' || rawStatus === 'PROCESSING';
    const canShip = !isProcessable || isCollectionActiveForShipping(collectionStatus);
    const ownerLabel = resolveOwnerLabel(orderItem, order?.buyerWallet, order?.recipientName || order?.buyerName);
    const fromLabel = order?.brandOwnerUsername
      ? `@${order.brandOwnerUsername}`
      : toHandle(product?.brandName);
    const currency = order?.currency || product?.currency || 'USD';

    return {
      id: `#${order.itemSerial || order.orderNumber || order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      statusSection: statusMeta.section,
      rawStatus: order?.status || 'PENDING',
      actionLabel: canShip ? statusMeta.actionLabel : undefined,
      canShip,
      name: order.productName || product?.productName || 'Product',
      collection: product?.collectionName || 'Collection',
      brand: product?.brandName || 'Brand',
      brandLogo: '',
      image: product?.imageUrl || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60',
      edition: Number(orderItem?.itemIndex || 0),
      total: Number(product?.totalQuantity || 0),
      specs: [
        { label: 'Category', value: String(product?.category || 'OTHER').replace(/_/g, ' ') },
        { label: 'Order Status', value: String(order?.status || 'PENDING').replace(/_/g, ' ') },
      ],
      transaction: {
        currentOwner: ownerLabel,
        record: product?.contractAddress || shortAddress(order?.buyerWallet),
        from: fromLabel,
        to: ownerLabel,
        value: `${currency} ${formatUsd(order?.totalPrice)}`,
        usd: '',
      },
      delivery: deriveDelivery(order, statusMeta),
      recipientName: order?.recipientName || order?.buyerName || '-',
      recipientPhone: order?.recipientPhoneNumber || order?.buyerPhoneNumber || '-',
      qrValue:
        orderItem?.certificateQrCode ||
        `trustmark://certificate/${order.itemSerial || order.orderNumber}`,
    };
  },

  async processCreatorOrder(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    return apiRequest(`/shipments/${orderId}/process`, {
      method: 'POST',
    });
  },

  async shipCreatorOrders(orderIds = [], deliveryDetails = {}) {
    const safeOrderIds = Array.from(
      new Set((Array.isArray(orderIds) ? orderIds : []).filter((id) => id != null))
    );

    if (safeOrderIds.length === 0) {
      throw new Error('No orders selected');
    }

    const results = await Promise.allSettled(
      safeOrderIds.map((orderId) => moveOrderToShipment(this, orderId, deliveryDetails))
    );

    const failedIds = results
      .map((result, index) => (result.status === 'rejected' ? safeOrderIds[index] : null))
      .filter((value) => value != null);

    return {
      processed: safeOrderIds.length - failedIds.length,
      failed: failedIds.length,
      failedIds,
    };
  },

  async shipCreatorInStockItems(productItemIds = [], deliveryDetails = {}) {
    const safeItemIds = Array.from(
      new Set((Array.isArray(productItemIds) ? productItemIds : []).filter((id) => id != null))
    );

    if (safeItemIds.length === 0) {
      throw new Error('No in-stock items selected');
    }

    const results = await Promise.allSettled(
      safeItemIds.map((itemId) =>
        apiRequest(`/shipments/items/${itemId}/ship`, {
          method: 'POST',
          body: {
            trackingNumber:
              String(deliveryDetails?.trackingNumber || '').trim() ||
              buildTrackingNumber(`ITEM-${itemId}`),
            recipientName: deliveryDetails?.recipientName,
            recipientPhone: deliveryDetails?.recipientPhone,
            shippingAddress: deliveryDetails?.shippingAddress,
            estimatedAt: deliveryDetails?.estimatedAt,
          },
        })
      )
    );

    const failedIds = results
      .map((result, index) => (result.status === 'rejected' ? safeItemIds[index] : null))
      .filter((value) => value != null);

    return {
      processed: safeItemIds.length - failedIds.length,
      failed: failedIds.length,
      failedIds,
    };
  },

  async shipCreatorOrder(orderId, deliveryDetails = {}) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    const trackingNumber = String(deliveryDetails?.trackingNumber || '').trim() || buildTrackingNumber(orderId);

    return apiRequest(`/shipments/${orderId}/ship`, {
      method: 'POST',
      body: {
        trackingNumber,
        recipientName: deliveryDetails?.recipientName,
        recipientPhone: deliveryDetails?.recipientPhone,
        shippingAddress: deliveryDetails?.shippingAddress,
        estimatedAt: deliveryDetails?.estimatedAt,
      },
    });
  },

  async completeCreatorOrder(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    return apiRequest(`/shipments/${orderId}/complete`, {
      method: 'POST',
    });
  },

  async findShippedOrderForItemSerial(productId, itemSerial) {
    if (!productId || !itemSerial) {
      return null;
    }

    const targetSerial = normalizeSerial(itemSerial);
    const page = await apiRequest(`/shipments/product/${productId}?page=0&size=100`).catch(() => null);
    const orders = parsePageContent(page);

    const matched = orders.find((order) => {
      const status = String(order?.status || '').trim().toUpperCase();
      return status === 'SHIPPED' && normalizeSerial(order?.itemSerial) === targetSerial;
    });

    if (!matched) {
      return null;
    }

    return {
      orderId: matched.id,
      orderNumber: matched.orderNumber,
      itemSerial: matched.itemSerial,
      status: matched.status,
    };
  },
};

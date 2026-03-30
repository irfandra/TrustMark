import { apiRequest } from './apiClient';
import { DEFAULT_BRAND_ID } from './brandService';

const STATUS_META = {
  PENDING: { section: 'Request', actionLabel: 'Process', deliveryStatus: 'Request' },
  PAYMENT_RECEIVED: { section: 'Request', actionLabel: 'Process', deliveryStatus: 'Request' },
  PROCESSING: { section: 'On Prepare', actionLabel: 'Ship', deliveryStatus: 'On Prepare' },
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

const formatPol = (value) => {
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

const resolveOwnerLabel = (item, fallbackWallet, fallbackUsername) => {
  const safeUsername = String(fallbackUsername || '').trim();
  if (safeUsername) {
    return `@${safeUsername}`;
  }

  const username = String(item?.currentOwnerUsername || '').trim();
  if (username) {
    return `@${username}`;
  }

  const ownerWallet = String(item?.currentOwnerWallet || '').trim();
  if (ownerWallet) {
    return shortAddress(ownerWallet);
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

const mapOrderCard = (order, product) => {
  const meta = STATUS_META[order?.status] || STATUS_META.PENDING;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: meta.section,
    rawStatus: order.status,
    itemId: order.itemSerial || order.orderNumber || String(order.id),
    displayId: `#${order.itemSerial || order.orderNumber || order.id}`,
    itemName: order.productName || product?.productName || 'Unnamed Item',
    collection: product?.collectionName || 'Collection',
    pol: Number(order.totalPrice || 0),
    actionLabel: meta.actionLabel,
    createdAt: order.createdAt || null,
  };
};

const buildTrackingNumber = (orderId) => {
  const stamp = Date.now().toString().slice(-8);
  return `ZEAL-${orderId}-${stamp}`;
};

const deriveDelivery = (order, meta) => {
  const status = meta.deliveryStatus;
  return {
    status,
    claimedTime: formatDate(order?.completedAt || order?.deliveredAt),
    arrivalTime: formatDate(order?.deliveredAt || order?.shippedAt),
    address: order?.shippingAddress || '-',
    recipientName: '-',
    phone: '-',
  };
};

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
          products: Array.isArray(products) ? products : [],
        };
      })
    );

    const flatProducts = groupedProducts.flatMap(({ products }) => products);

    const orderPages = await Promise.all(
      flatProducts.map((product) =>
        apiRequest(`/orders/product/${product.id}?page=0&size=100`)
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

  async getCreatorOrderDetail(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    const order = await apiRequest(`/orders/${orderId}`);

    const [product, items] = await Promise.all([
      apiRequest(`/products/${order.productId}`).catch(() => null),
      apiRequest(`/products/${order.productId}/items`).catch(() => []),
    ]);

    const relatedItems = Array.isArray(items) ? items : [];
    const orderItem = relatedItems.find((item) =>
      (order.productItemId != null && item.id === order.productItemId) ||
      (order.itemSerial != null && item.itemSerial === order.itemSerial)
    );

    const statusMeta = STATUS_META[order?.status] || STATUS_META.PENDING;
    const ownerLabel = resolveOwnerLabel(orderItem, order?.buyerWallet, order?.buyerUsername);
    const fromLabel = order?.brandOwnerUsername
      ? `@${order.brandOwnerUsername}`
      : toHandle(product?.brandName);

    return {
      id: `#${order.itemSerial || order.orderNumber || order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      statusSection: statusMeta.section,
      rawStatus: order?.status || 'PENDING',
      actionLabel: statusMeta.actionLabel,
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
        contract: product?.contractAddress || shortAddress(orderItem?.currentOwnerWallet),
        from: fromLabel,
        to: ownerLabel,
        value: `POL ${formatPol(order?.totalPrice)}`,
        usd: '',
      },
      delivery: deriveDelivery(order, statusMeta),
      recipientName: order?.buyerName || '-',
      recipientPhone: order?.buyerPhoneNumber || '-',
      qrValue:
        orderItem?.nftQrCode ||
        orderItem?.productLabelQrCode ||
        orderItem?.certificateQrCode ||
        `digitalseal://order/${order.orderNumber}`,
    };
  },

  async processCreatorOrder(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    return apiRequest(`/orders/${orderId}/process`, {
      method: 'POST',
    });
  },

  async shipCreatorOrder(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }

    return apiRequest(`/orders/${orderId}/ship`, {
      method: 'POST',
      body: {
        trackingNumber: buildTrackingNumber(orderId),
      },
    });
  },
};

import { brandService, DEFAULT_BRAND_ID } from './brandService';
import { apiRequest } from './apiClient';

const FALLBACK_COLLECTION_IMAGE =
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60';
const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60';

const STOCK_STATUS_COLORS = {
  'In Stock': { tagColor: '#2D7A4E', tagTextColor: '#fff' },
  'Medium Stock': { tagColor: '#B6842D', tagTextColor: '#fff' },
  'Low Stock': { tagColor: '#D95F47', tagTextColor: '#fff' },
  'Out of Stock': { tagColor: '#6B5A4B', tagTextColor: '#fff' },
  'No Stock': { tagColor: '#9E8F7C', tagTextColor: '#fff' },
};

const getStockStatusTag = (totalProduced, inStock) => {
  const safeTotal = Math.max(Number(totalProduced) || 0, 0);
  const safeInStock = Math.max(Number(inStock) || 0, 0);

  if (safeTotal <= 0) {
    return {
      tag: 'No Stock',
      ...STOCK_STATUS_COLORS['No Stock'],
    };
  }

  if (safeInStock <= 0) {
    return {
      tag: 'Out of Stock',
      ...STOCK_STATUS_COLORS['Out of Stock'],
    };
  }

  const ratio = safeInStock / safeTotal;

  if (ratio < 0.1) {
    return {
      tag: 'Low Stock',
      ...STOCK_STATUS_COLORS['Low Stock'],
    };
  }

  if (ratio < 0.4) {
    return {
      tag: 'Medium Stock',
      ...STOCK_STATUS_COLORS['Medium Stock'],
    };
  }

  return {
    tag: 'In Stock',
    ...STOCK_STATUS_COLORS['In Stock'],
  };
};

const mapCategoryToProductCategory = (category) => {
  const normalized = String(category || '').trim().toLowerCase();

  if (!normalized) return 'OTHER';
  if (normalized.includes('bag') || normalized.includes('handbag')) return 'HANDBAG';
  if (normalized.includes('watch')) return 'WATCH';
  if (normalized.includes('shoe') || normalized.includes('sneaker')) return 'SNEAKERS';
  if (normalized.includes('cloth') || normalized.includes('apparel')) return 'CLOTHING';
  if (normalized.includes('jewel')) return 'JEWELRY';
  if (normalized.includes('accessor')) return 'ACCESSORIES';
  if (normalized.includes('perfume') || normalized.includes('fragrance')) return 'PERFUME';
  if (normalized.includes('eyewear') || normalized.includes('glasses')) return 'EYEWEAR';
  if (normalized.includes('footwear')) return 'FOOTWEAR';
  if (normalized.includes('electronic') || normalized.includes('gadget')) return 'ELECTRONICS';
  if (normalized.includes('art')) return 'ART';
  if (normalized.includes('collect')) return 'COLLECTIBLE';

  return 'OTHER';
};

const parseNumericInput = (value) => {
  if (value == null) return NaN;
  const cleaned = String(value).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const formatStatus = (status) => {
  if (!status) return 'Draft';
  const normalized = String(status).toLowerCase();
  if (normalized === 'active' || normalized === 'listed') return 'Active';
  if (normalized === 'inactive' || normalized === 'expired') return 'Inactive';
  return 'Draft';
};

const mapUiStatusToApiStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'active' || normalized === 'listed') {
    return 'ACTIVE';
  }

  if (normalized === 'inactive' || normalized === 'expired') {
    return 'INACTIVE';
  }

  return 'DRAFT';
};

const normalizeProductStatusToApi = (status) => {
  const normalized = String(status || '').trim().toUpperCase();

  if (normalized === 'ACTIVE' || normalized === 'PUBLISHED' || normalized === 'PREMINTED' || normalized === 'LISTED') {
    return 'ACTIVE';
  }

  if (normalized === 'INACTIVE' || normalized === 'SOLD_OUT' || normalized === 'COMPLETED' || normalized === 'EXPIRED') {
    return 'INACTIVE';
  }

  return 'DRAFT';
};

const formatProductStatusLabel = (status) => {
  const normalized = normalizeProductStatusToApi(status);

  if (normalized === 'ACTIVE') {
    return 'Active';
  }

  if (normalized === 'INACTIVE') {
    return 'Inactive';
  }

  return 'Draft';
};

const mapCollectionToUI = (collection) => {
  const status = formatStatus(collection.status);
  const itemsCount = Number(collection.itemsCount ?? collection.productCount ?? 0);
  const soldCount = Math.max(Number(collection.soldCount ?? 0), 0);
  const inStockCount = Math.max(itemsCount - soldCount, 0);
  const stockTag = getStockStatusTag(itemsCount, inStockCount);

  return {
    id: String(collection.id),
    status,
    brand: collection.brandName || 'Unknown Brand',
    brandLogo: collection.brandLogo || undefined,
    tag: stockTag.tag,
    title: collection.collectionName || 'Untitled Collection',
    subtitle: collection.category || 'Collection',
    itemsCount,
    soldCount,
    floorPrice: 'USD --',
    floorUsd: '',
    image: collection.imageUrl || FALLBACK_COLLECTION_IMAGE,
    description: String(collection.description || '').trim(),
    items: `👜 ${itemsCount.toLocaleString()} Items`,
    tagColor: stockTag.tagColor,
    tagTextColor: stockTag.tagTextColor,
  };
};

const formatPriceAmount = (price) => {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) {
    return '--';
  }

  const hasDecimals = Math.abs(numeric % 1) > 0;
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

const parseProductPrice = (product) => {
  const direct = Number(product?.price);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const fallback = String(product?.priceAmount ?? '')
    .replace(/[^0-9.-]/g, '')
    .trim();
  const parsed = Number(fallback);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const getCollectionFloorPrice = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return 'USD --';
  }

  const minPrice = products.reduce((currentMin, product) => {
    const price = parseProductPrice(product);
    if (!Number.isFinite(price)) {
      return currentMin;
    }
    return Math.min(currentMin, price);
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(minPrice)) {
    return 'USD --';
  }

  return `USD ${formatPriceAmount(minPrice)}`;
};

const extractPageContent = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.content)) {
    return value.content;
  }

  return [];
};

const shortenWallet = (wallet) => {
  const safeWallet = String(wallet || '').trim();
  if (!safeWallet) {
    return 'Unknown';
  }

  if (safeWallet.length <= 12) {
    return safeWallet;
  }

  return `${safeWallet.slice(0, 6)}...${safeWallet.slice(-4)}`;
};

const resolveOwnerIdentity = (item, fallbackAddress) => {
  if (typeof item?.status === 'boolean') {
    return item.status
      ? {
          key: 'stock:in-stock',
          label: 'In Stock',
        }
      : {
          key: 'stock:unavailable',
          label: 'Not In Stock',
        };
  }

  const contractAddress = String(fallbackAddress || '').trim();
  if (contractAddress) {
    return {
      key: `contract:${contractAddress.toLowerCase()}`,
      label: shortenWallet(contractAddress),
    };
  }

  return {
    key: 'unassigned',
    label: 'Unassigned',
  };
};

const mapCollectionOwners = (groupedItems) => {
  const ownerMap = new Map();

  groupedItems.forEach(({ product, items }) => {
    const unitPrice = parseProductPrice(product);
    const contractAddress = product?.contractAddress;

    (Array.isArray(items) ? items : []).forEach((item) => {
      const ownerIdentity = resolveOwnerIdentity(item, contractAddress);
      const existing = ownerMap.get(ownerIdentity.key) || {
        id: ownerIdentity.label,
        count: 0,
        totalValue: 0,
      };

      existing.count += 1;
      if (Number.isFinite(unitPrice)) {
        existing.totalValue += unitPrice;
      }

      ownerMap.set(ownerIdentity.key, existing);
    });
  });

  return Array.from(ownerMap.values())
    .map((entry) => ({
      id: entry.id,
      edition: `${entry.count.toLocaleString()} item${entry.count === 1 ? '' : 's'}`,
      price: entry.totalValue > 0 ? formatPriceAmount(entry.totalValue) : '--',
      count: entry.count,
      totalValue: entry.totalValue,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return right.totalValue - left.totalValue;
    });
};

const normalizeSerial = (value) => String(value || '').trim().toUpperCase();

const formatOrderStatusLabel = (status) => {
  const normalized = String(status || '').trim().toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return 'Pending';
    case 'PAYMENT_RECEIVED':
      return 'Payment Received';
    case 'PROCESSING':
      return 'Processing';
    case 'SHIPPED':
      return 'On Shipment';
    case 'DELIVERED':
      return 'Delivered';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return normalized ? normalized.replace(/_/g, ' ') : 'Unknown';
  }
};

const formatItemStatusLabel = (status) => {
  if (typeof status === 'boolean') {
    return status ? 'In Stock' : 'Not In Stock';
  }

  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'TRUE' || normalized === 'IN_STOCK') {
    return 'In Stock';
  }
  if (normalized === 'FALSE' || normalized === 'OUT_OF_STOCK') {
    return 'Not In Stock';
  }

  return normalized ? normalized.replace(/_/g, ' ') : 'Unknown';
};

const buildOrderStatusIndex = (orders) => {
  const byItemId = new Map();
  const bySerial = new Map();

  (Array.isArray(orders) ? orders : []).forEach((order) => {
    const statusLabel = formatOrderStatusLabel(order?.status);

    if (order?.productItemId != null) {
      byItemId.set(String(order.productItemId), statusLabel);
    }

    const serial = normalizeSerial(order?.itemSerial);
    if (serial) {
      bySerial.set(serial, statusLabel);
    }
  });

  return { byItemId, bySerial };
};

const mapProductItemsToStatusRows = (items, orders = []) => {
  const { byItemId, bySerial } = buildOrderStatusIndex(orders);

  return (Array.isArray(items) ? items : []).map((item) => {
    const serial = String(item?.itemSerial || item?.id || '').trim();
    const normalizedSerial = normalizeSerial(serial);
    const status =
      byItemId.get(String(item?.id ?? '')) ||
      (normalizedSerial ? bySerial.get(normalizedSerial) : null) ||
      formatItemStatusLabel(item?.status);

    return {
      itemId: serial ? `#${serial}` : `#${item?.id ?? 'N/A'}`,
      productName: item?.productName || '',
      status,
    };
  });
};

const mapProductItemsToPurchaseRows = (items, fallbackProduct) => {
  const total = Number(fallbackProduct.total || items.length);
  const basePrice = Number(String(fallbackProduct.priceAmount).replace(/,/g, ''));

  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.map((item) => {
    const itemIndex = Number(item.itemIndex || 0);
    const adjustedPrice = Number.isFinite(basePrice)
      ? formatPriceAmount(basePrice)
      : fallbackProduct.priceAmount;
    const serial = String(item.itemSerial || item.id || '');

    return {
      id: `#${serial}`,
      itemSerial: serial,
      edition: `${itemIndex.toLocaleString()} of ${total.toLocaleString()}`,
      price: adjustedPrice,
      certificateQrCode: String(item.certificateQrCode || '').trim(),
      status: typeof item?.status === 'boolean' ? item.status : null,
      statusLabel: formatItemStatusLabel(item?.status),
      shippedAt: item.shippedAt || null,
      createdAt: item.createdAt || null,
    };
  });
};

const mapProductToCatalogItem = (product) => {
  const total = Number(product.totalQuantity ?? 0);
  const available = Number(product.availableQuantity ?? 0);

  return {
    id: String(product.id),
    name: product.productName || 'Unnamed Product',
    collection: product.collectionName || 'Uncategorized',
    brand: product.brandName || 'Unknown Brand',
    available: Number.isFinite(available) ? available : 0,
    total: Number.isFinite(total) ? total : 0,
    priceAmount: formatPriceAmount(product.price),
    priceUsd: '',
    currency: product.currency || 'USD',
    image: product.imageUrl || FALLBACK_PRODUCT_IMAGE,
    description: product.description || '',
    category: product.category || 'OTHER',
    status: normalizeProductStatusToApi(product.status),
  };
};

const mapProductToDetail = (product, productItems = [], orders = []) => {
  const catalogItem = mapProductToCatalogItem(product);

  return {
    ...catalogItem,
    specifications: [
      {
        label: 'Category',
        value: String(product.category || 'OTHER').replace(/_/g, ' '),
      },
      {
        label: 'Status',
        value: formatProductStatusLabel(product.status),
      },
    ],
    purchaseItems: mapProductItemsToPurchaseRows(productItems, catalogItem),
    activity: mapProductItemsToStatusRows(productItems, orders),
  };
};

export const collectionService = {
  async getCollectionsByBrand(brandId = DEFAULT_BRAND_ID) {
    const data = await apiRequest(`/brands/${brandId}/collections`);
    if (!Array.isArray(data)) {
      return [];
    }

    const mappedCollections = data.map(mapCollectionToUI);

    return Promise.all(
      mappedCollections.map(async (collection) => {
        const products = await apiRequest(`/collections/${collection.id}/products`).catch(() => []);

        const stockSummary = (Array.isArray(products) ? products : []).reduce(
          (summary, product) => {
            const total = Number(product?.totalQuantity ?? product?.total ?? 0);
            const available = Number(product?.availableQuantity ?? product?.available ?? 0);

            if (Number.isFinite(total) && total > 0) {
              summary.total += total;
            }

            if (Number.isFinite(available) && available >= 0) {
              summary.inStock += available;
            }

            return summary;
          },
          { total: 0, inStock: 0 }
        );

        const totalProduced = stockSummary.total > 0
          ? stockSummary.total
          : Number(collection.itemsCount || 0);
        const normalizedInStock = Math.max(
          Math.min(stockSummary.inStock, totalProduced),
          0
        );
        const soldCount = Math.max(totalProduced - normalizedInStock, 0);
        const stockTag = getStockStatusTag(totalProduced, normalizedInStock);

        return {
          ...collection,
          itemsCount: totalProduced,
          soldCount,
          tag: stockTag.tag,
          tagColor: stockTag.tagColor,
          tagTextColor: stockTag.tagTextColor,
          floorPrice: getCollectionFloorPrice(products),
        };
      })
    );
  },

  async getCollectionsForCreatorHome(brandId = DEFAULT_BRAND_ID) {
    return this.getCollectionsByBrand(brandId);
  },

  async getBrandSummary(brandId = DEFAULT_BRAND_ID) {
    const brand = await brandService.getBrandById(brandId);
    return {
      id: brand.id,
      brandName: brand.brandName,
      logo: brand.logo,
      banner: brand.companyBanner,
    };
  },

  async getProductsByCollection(collectionId) {
    if (!collectionId) {
      return [];
    }

    const data = await apiRequest(`/collections/${collectionId}/products`);
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(mapProductToCatalogItem);
  },

  async getProductById(productId) {
    if (!productId) {
      throw new Error('Missing product id');
    }

    const data = await apiRequest(`/products/${productId}`);

    let items = [];
    if (data?.brandId != null) {
      items = await apiRequest(`/brands/${data.brandId}/products/${productId}/items`).catch(() => []);
    }

    if (!Array.isArray(items) || items.length === 0) {
      items = await apiRequest(`/products/${productId}/items`).catch(() => []);
    }

    const orderPage = await apiRequest(`/shipments/product/${productId}?page=0&size=100`).catch(() => null);

    const orders = extractPageContent(orderPage);

    return mapProductToDetail(data, items, orders);
  },

  async getCollectionActivity(collectionId) {
    if (!collectionId) {
      return [];
    }

    const products = await apiRequest(`/collections/${collectionId}/products`).catch(() => []);
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    const statusRows = await Promise.all(
      products.map(async (product) => {
        const productId = product?.id;
        if (!productId) {
          return [];
        }

        const [items, orderPage] = await Promise.all([
          apiRequest(`/products/${productId}/items`).catch(() => []),
          apiRequest(`/shipments/product/${productId}?page=0&size=100`).catch(() => null),
        ]);

        const orders = extractPageContent(orderPage);
        return mapProductItemsToStatusRows(items, orders);
      })
    );

    return statusRows.flat();
  },

  async getCollectionOwners(collectionId) {
    if (!collectionId) {
      return [];
    }

    const products = await apiRequest(`/collections/${collectionId}/products`).catch(() => []);
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    const groupedItems = await Promise.all(
      products.map(async (product) => {
        const productId = product?.id;
        const items = productId
          ? await apiRequest(`/products/${productId}/items`).catch(() => [])
          : [];

        return {
          product,
          items,
        };
      })
    );

    return mapCollectionOwners(groupedItems);
  },

  async createCollectionWithVariations(
    {
      collectionName,
      category,
      about,
      imageUrl,
      totalItems,
      variations,
      publishNow = false,
    },
    brandId = DEFAULT_BRAND_ID
  ) {
    const safeCollectionName = String(collectionName || '').trim();
    if (!safeCollectionName) {
      throw new Error('Collection name is required');
    }

    const safeVariations = Array.isArray(variations)
      ? variations
          .map((variation) => {
            const quantity = parseNumericInput(variation.quantity);
            const price = parseNumericInput(variation.price);
            return {
              name: String(variation.name || '').trim(),
              description: String(variation.description || '').trim(),
              imageUrl: String(variation.imageUrl || '').trim(),
              quantity,
              price,
            };
          })
          .filter((variation) => variation.name && variation.quantity > 0 && variation.price > 0)
      : [];

    if (safeVariations.length === 0) {
      throw new Error('At least one valid variation is required');
    }

    const totalItemsNumber = parseNumericInput(totalItems);
    const variationTotal = safeVariations.reduce((sum, variation) => sum + variation.quantity, 0);

    if (Number.isFinite(totalItemsNumber) && totalItemsNumber > 0) {
      if (variationTotal !== totalItemsNumber) {
        throw new Error(`Total variation quantity must equal ${totalItemsNumber}`);
      }
    }

    const producedCount = Number.isFinite(totalItemsNumber) && totalItemsNumber > 0
      ? totalItemsNumber
      : variationTotal;
    const stockTag = getStockStatusTag(producedCount, producedCount);

    const createdCollection = await apiRequest(`/brands/${brandId}/collections`, {
      method: 'POST',
      body: {
        collectionName: safeCollectionName,
        description: String(about || '').trim() || null,
        imageUrl: String(imageUrl || '').trim() || null,
        category: String(category || '').trim() || null,
        status: publishNow ? 'ACTIVE' : 'DRAFT',
        tag: stockTag.tag,
      },
    });

    const mappedCategory = mapCategoryToProductCategory(category);

    await Promise.all(
      safeVariations.map((variation) =>
        apiRequest(`/brands/${brandId}/products`, {
          method: 'POST',
          body: {
            productName: variation.name,
            description: variation.description || String(about || '').trim() || null,
            category: mappedCategory,
            imageUrl: variation.imageUrl || String(imageUrl || '').trim() || null,
            collectionId: createdCollection.id,
            price: variation.price,
            quantity: variation.quantity,
          },
        })
      )
    );

    return createdCollection;
  },

  async updateCollection(
    collectionId,
    {
      collectionName,
      description,
      imageUrl,
      category,
      status,
      tag,
    },
    brandId = DEFAULT_BRAND_ID
  ) {
    if (!collectionId) {
      throw new Error('Collection id is required');
    }

    const safeCollectionName = String(collectionName || '').trim();
    if (safeCollectionName.length < 2) {
      throw new Error('Collection name must be at least 2 characters');
    }

    const body = {
      collectionName: safeCollectionName,
      description: String(description || '').trim() || null,
      imageUrl: String(imageUrl || '').trim() || null,
      category: String(category || '').trim() || null,
      status: mapUiStatusToApiStatus(status),
    };

    if (tag !== undefined) {
      body.tag = String(tag || '').trim() || null;
    }

    return apiRequest(`/brands/${brandId}/collections/${collectionId}`, {
      method: 'PUT',
      body,
    });
  },

  async deleteCollection(collectionId, brandId = DEFAULT_BRAND_ID) {
    if (!collectionId) {
      throw new Error('Collection id is required');
    }

    return apiRequest(`/brands/${brandId}/collections/${collectionId}`, {
      method: 'DELETE',
    });
  },
};

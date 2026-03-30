import { brandService, DEFAULT_BRAND_ID } from './brandService';
import { apiRequest } from './apiClient';

const FALLBACK_COLLECTION_IMAGE =
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60';
const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60';

const RARITY_TO_TAG_COLORS = {
  Standard: { tagColor: '#4CAF50', tagTextColor: '#fff' },
  Common: { tagColor: '#90CAF9', tagTextColor: '#fff' },
  Rare: { tagColor: '#111', tagTextColor: '#fff' },
  'Ultra Rare': { tagColor: '#9C27B0', tagTextColor: '#fff' },
  Limited: { tagColor: '#FFC107', tagTextColor: '#111' },
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
  if (normalized === 'listed') return 'Listed';
  if (normalized === 'expired') return 'Expired';
  return 'Draft';
};

const formatTagDefaults = (tag, status) => {
  if (tag) {
    return {
      tag,
      tagColor: '#111',
      tagTextColor: '#fff',
    };
  }

  if (status === 'Listed') {
    return {
      tag: 'Limited',
      tagColor: '#ffb300',
      tagTextColor: '#111',
    };
  }

  if (status === 'Expired') {
    return {
      tag: 'Common',
      tagColor: '#333',
      tagTextColor: '#fff',
    };
  }

  return {
    tag: 'Rare',
    tagColor: '#111',
    tagTextColor: '#fff',
  };
};

const mapSalesEnd = (salesEndAt) => {
  if (!salesEndAt) {
    return {};
  }

  const nowMs = Date.now();
  const endMs = new Date(salesEndAt).getTime();
  if (!Number.isFinite(endMs)) {
    return {};
  }

  const diffSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
  if (diffSeconds === 0) {
    return {};
  }

  if (diffSeconds >= 86400) {
    return { saleEndsInDays: Math.ceil(diffSeconds / 86400) };
  }

  return { saleEndsInSeconds: diffSeconds };
};

const mapCollectionToUI = (collection) => {
  const status = formatStatus(collection.status);
  const { tag, tagColor, tagTextColor } = formatTagDefaults(collection.tag, status);

  const itemsCount = Number(collection.itemsCount ?? collection.productCount ?? 0);
  const soldCount = 0;

  return {
    id: String(collection.id),
    status,
    brand: collection.brandName || 'Unknown Brand',
    brandLogo: collection.brandLogo || undefined,
    tag,
    title: collection.collectionName || 'Untitled Collection',
    subtitle: collection.season || 'Collection',
    itemsCount,
    soldCount,
    floorPrice: 'POL --',
    floorUsd: '',
    image: collection.imageUrl || FALLBACK_COLLECTION_IMAGE,
    items: `👜 ${itemsCount.toLocaleString()} Items`,
    tagColor: collection.tagColor || tagColor,
    tagTextColor: collection.tagTextColor || tagTextColor,
    ...mapSalesEnd(collection.salesEndAt),
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
    return 'POL --';
  }

  const minPrice = products.reduce((currentMin, product) => {
    const price = parseProductPrice(product);
    if (!Number.isFinite(price)) {
      return currentMin;
    }
    return Math.min(currentMin, price);
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(minPrice)) {
    return 'POL --';
  }

  return `POL ${formatPriceAmount(minPrice)}`;
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
  const username = String(item?.currentOwnerUsername || '').trim();
  if (username) {
    return {
      key: `user:${username.toLowerCase()}`,
      label: `@${username}`,
    };
  }

  const ownerWallet = String(item?.currentOwnerWallet || '').trim();
  if (ownerWallet) {
    return {
      key: `wallet:${ownerWallet.toLowerCase()}`,
      label: shortenWallet(ownerWallet),
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

const buildOrderActivityRows = (order) => {
  const rows = [];
  const buyerWallet = shortenWallet(order?.buyerWallet);
  const itemLabel = order?.itemSerial
    ? `#${order.itemSerial}`
    : order?.orderNumber || `#${order?.id || 'N/A'}`;
  const price = formatPriceAmount(order?.totalPrice);

  const pushRow = (event, timestamp, from, to) => {
    if (!timestamp) {
      return;
    }

    rows.push({
      id: `${order?.id || 'order'}-${event}-${timestamp}`,
      event,
      item: itemLabel,
      price,
      from,
      to,
      timestamp,
    });
  };

  pushRow('Order Placed', order?.createdAt, buyerWallet, 'Brand');
  pushRow('Payment Confirmed', order?.paymentConfirmedAt, buyerWallet, 'Brand');
  pushRow('Shipped', order?.shippedAt, 'Brand', buyerWallet);
  pushRow('Delivered', order?.deliveredAt, 'Brand', buyerWallet);
  pushRow('Completed', order?.completedAt, 'Brand Vault', buyerWallet);
  pushRow('Cancelled', order?.cancelledAt, 'Brand', buyerWallet);

  if (rows.length === 0) {
    rows.push({
      id: `${order?.id || 'order'}-status`,
      event: String(order?.status || 'Order').replace(/_/g, ' '),
      item: itemLabel,
      price,
      from: 'Brand',
      to: buyerWallet,
      timestamp: order?.createdAt || null,
    });
  }

  return rows;
};

const mapOrdersToActivity = (orders) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  return safeOrders
    .flatMap(buildOrderActivityRows)
    .sort((a, b) => {
      const left = new Date(b.timestamp || 0).getTime();
      const right = new Date(a.timestamp || 0).getTime();
      return left - right;
    });
};

const getScarcityLabel = (itemIndex, total) => {
  const safeIndex = Number(itemIndex || 0);
  const safeTotal = Number(total || 0);

  if (!Number.isFinite(safeIndex) || safeIndex <= 0 || !Number.isFinite(safeTotal) || safeTotal <= 0) {
    return 'Standard';
  }

  if (safeIndex === 1) return 'Genesis';

  const ratio = safeIndex / safeTotal;
  if (ratio <= 0.05) return 'Ultra Rare';
  if (ratio <= 0.15) return 'Rare';
  if (ratio <= 0.35) return 'Scarce';
  return 'Standard';
};

const getScarcityMultiplier = (label) => {
  if (label === 'Genesis') return 1.2;
  if (label === 'Ultra Rare') return 1.1;
  if (label === 'Rare') return 1.05;
  if (label === 'Scarce') return 1.02;
  return 1;
};

const mapProductItemsToPurchaseRows = (items, fallbackProduct) => {
  const total = Number(fallbackProduct.total || items.length);
  const basePrice = Number(String(fallbackProduct.priceAmount).replace(/,/g, ''));

  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.map((item) => {
    const itemIndex = Number(item.itemIndex || 0);
    const scarcity = getScarcityLabel(itemIndex, total);
    const multiplier = getScarcityMultiplier(scarcity);
    const adjustedPrice = Number.isFinite(basePrice)
      ? formatPriceAmount(basePrice * multiplier)
      : fallbackProduct.priceAmount;
    const serial = String(item.itemSerial || item.id || '');

    return {
      id: `#${serial}`,
      itemSerial: serial,
      edition: `${itemIndex.toLocaleString()} of ${total.toLocaleString()}`,
      price: adjustedPrice,
      nftQrCode: String(item.nftQrCode || '').trim(),
      productLabelQrCode: String(item.productLabelQrCode || '').trim(),
      certificateQrCode: String(item.certificateQrCode || '').trim(),
      sealStatus: item.sealStatus || '',
      mintedAt: item.mintedAt || null,
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
    image: product.imageUrl || FALLBACK_PRODUCT_IMAGE,
    description: product.description || '',
    category: product.category || 'OTHER',
    status: product.status || 'DRAFT',
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
        value: String(product.status || 'DRAFT').replace(/_/g, ' '),
      },
    ],
    purchaseItems: mapProductItemsToPurchaseRows(productItems, catalogItem),
    activity: mapOrdersToActivity(orders),
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
        const hasItems = Number(collection.itemsCount || 0) > 0;
        if (!hasItems) {
          return collection;
        }

        const products = await apiRequest(`/collections/${collection.id}/products`).catch(() => []);

        return {
          ...collection,
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
      statementLetterUrl: brand.statementLetterUrl,
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

    // Creator screens should prefer authenticated brand-scoped endpoint,
    // then fallback to public endpoint for compatibility.
    let items = [];
    if (data?.brandId != null) {
      items = await apiRequest(`/brands/${data.brandId}/products/${productId}/items`, {
        authRequired: true,
      }).catch(() => []);
    }

    if (!Array.isArray(items) || items.length === 0) {
      items = await apiRequest(`/products/${productId}/items`).catch(() => []);
    }

    const orderPage = await apiRequest(`/orders/product/${productId}?page=0&size=100`, {
      authRequired: true,
    }).catch(() => null);

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

    const orderPages = await Promise.all(
      products.map((product) =>
        apiRequest(`/orders/product/${product.id}?page=0&size=100`, {
          authRequired: true,
        }).catch(() => null)
      )
    );

    const orders = orderPages.flatMap((page) => extractPageContent(page));
    return mapOrdersToActivity(orders);
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
      rarity,
      variations,
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
    if (Number.isFinite(totalItemsNumber) && totalItemsNumber > 0) {
      const variationTotal = safeVariations.reduce((sum, variation) => sum + variation.quantity, 0);
      if (variationTotal !== totalItemsNumber) {
        throw new Error(`Total variation quantity must equal ${totalItemsNumber}`);
      }
    }

    const rarityKey = RARITY_TO_TAG_COLORS[rarity] ? rarity : 'Rare';
    const tagColors = RARITY_TO_TAG_COLORS[rarityKey];

    const createdCollection = await apiRequest(`/brands/${brandId}/collections`, {
      method: 'POST',
      authRequired: true,
      body: {
        collectionName: safeCollectionName,
        description: String(about || '').trim() || null,
        imageUrl: String(imageUrl || '').trim() || null,
        season: String(category || '').trim() || null,
        isLimitedEdition: rarityKey === 'Limited',
        status: 'DRAFT',
        tag: rarityKey,
        tagColor: tagColors.tagColor,
        tagTextColor: tagColors.tagTextColor,
      },
    });

    const mappedCategory = mapCategoryToProductCategory(category);

    await Promise.all(
      safeVariations.map((variation) =>
        apiRequest(`/brands/${brandId}/products`, {
          method: 'POST',
          authRequired: true,
          body: {
            productName: variation.name,
            description: variation.description || String(about || '').trim() || null,
            category: mappedCategory,
            imageUrl: String(imageUrl || '').trim() || null,
            collectionId: createdCollection.id,
            price: variation.price,
          },
        })
      )
    );

    return createdCollection;
  },
};

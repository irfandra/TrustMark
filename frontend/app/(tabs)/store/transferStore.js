// app/store/transferStore.js

let sharedState = {
  transferRequests: [],
  items: {
    'AZEDR': {
      id: '#AZEDR',
      name: 'Charizard',
      subtitle: 'Pokemon Card',
      tag: 'Limited',
      tagColor: '#C9A23C',
      price: 'POL 120,100',
      usd: '~$11,000',
      brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png',
      brand: 'Nintendo',
      image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60',
      nftQR: 'zeal://item/AZEDR/transfer',
      labelQR: 'zeal://item/AZEDR/label',
      certificateQR: 'zeal://item/AZEDR/certificate',
      owner: 'glimpse27',
      status: 'Claimed',
    },
    'BK291': {
      id: '#BK291',
      name: 'Birkin Brownies',
      subtitle: 'Luxury Bag',
      tag: 'Rare',
      tagColor: '#B8860B',
      price: 'POL 104,192',
      usd: '~$10,000',
      brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png',
      brand: 'Hermès',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60',
      nftQR: 'zeal://item/BK291/transfer',
      labelQR: 'zeal://item/BK291/label',
      certificateQR: 'zeal://item/BK291/certificate',
      owner: 'glimpse27',
      status: 'Prepared',
    },
    'NK412': {
      id: '#NK412',
      name: 'AJ1 Chicago',
      subtitle: 'Sneakers',
      tag: 'Common',
      tagColor: '#555',
      price: 'POL 25,000',
      usd: '~$2,400',
      brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',
      brand: 'Nike',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=60',
      nftQR: 'zeal://item/NK412/transfer',
      labelQR: 'zeal://item/NK412/label',
      certificateQR: 'zeal://item/NK412/certificate',
      owner: 'glimpse27',
      status: 'Shipped',
    },
    'LG088': {
      id: '#LG088',
      name: 'Falcon Standard',
      subtitle: 'Collectible Set',
      tag: 'Common',
      tagColor: '#555',
      price: 'POL 10,500',
      usd: '~$1,000',
      brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/200px-LEGO_logo.svg.png',
      brand: 'LEGO',
      image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=60',
      nftQR: 'zeal://item/LG088/transfer',
      labelQR: 'zeal://item/LG088/label',
      certificateQR: 'zeal://item/LG088/certificate',
      owner: 'glimpse27',
      status: 'Requested',
    },
  },
};

// ── Items ──────────────────────────────────────────────
export const getAllItems = () => sharedState.items;

export const getMyItems = (user) =>
  Object.values(sharedState.items).filter((i) => i.owner === user);

export const getItemById = (itemId) => {
  const cleanId = itemId.replace('#', '');
  return sharedState.items[cleanId] ?? null;
};

export const transferItem = (itemId, toUser) => {
  const cleanId = itemId.replace('#', '');
  if (sharedState.items[cleanId]) {
    sharedState.items[cleanId].owner = toUser;
  }
};

// ── Transfer Requests ──────────────────────────────────
export const createTransferRequest = ({ itemId, fromUser, toUser }) => {
  // Prevent duplicate requests
  const existing = sharedState.transferRequests.find(
    (r) => r.itemId === itemId && r.toUser === toUser && r.status === 'pending'
  );
  if (existing) return existing;

  const req = {
    id: `req_${Date.now()}`,
    itemId,
    fromUser,
    toUser,
    status: 'pending',
    createdAt: new Date().toISOString(),
    dateRequested: new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),
    timeRequested: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    }),
  };
  sharedState.transferRequests.push(req);
  return req;
};

export const getTransferRequests = (ownerUser) =>
  sharedState.transferRequests.filter(
    (r) => r.fromUser === ownerUser && r.status === 'pending'
  );

export const approveTransferRequest = (requestId) => {
  const req = sharedState.transferRequests.find((r) => r.id === requestId);
  if (req) {
    req.status = 'approved';
    transferItem(req.itemId, req.toUser);
  }
  return req;
};

export const rejectTransferRequest = (requestId) => {
  const req = sharedState.transferRequests.find((r) => r.id === requestId);
  if (req) req.status = 'rejected';
  return req;
};
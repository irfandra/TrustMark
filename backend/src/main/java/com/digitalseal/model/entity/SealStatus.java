package com.digitalseal.model.entity;

/**
 * Status of an individual digital seal (NFT) for a product item.
 * 
 * Flow: PRE_MINTED → RESERVED → REALIZED → (BURNED or REVOKED)
 */
public enum SealStatus {
    PRE_MINTED,     // NFT minted on-chain, not yet sold
    RESERVED,       // Buyer has placed an order, payment pending/confirmed
    REALIZED,       // Ownership transferred to buyer's wallet
    // ...existing code...
}

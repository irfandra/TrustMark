package com.digitalseal.model.entity;

/**
 * Status of an individual item authentication record.
 * 
 * Flow: PRE_MINTED → RESERVED → REALIZED → (BURNED or REVOKED)
 */
public enum SealStatus {
    PRE_MINTED,     // Item payload generated, not yet sold
    RESERVED,       // Buyer has placed an order, payment pending/confirmed
    REALIZED,       // Ownership transferred to buyer's wallet
    // ...existing code...
}

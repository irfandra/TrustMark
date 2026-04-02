package com.digitalseal.model.entity;

/**
 * Product lifecycle status.
 * 
 * Flow: DRAFT → PUBLISHED → PREMINTED → LISTED → SOLD_OUT → COMPLETED → ARCHIVED
 * Brands can DELIST a listed product, and ARCHIVE completed or delisted products.
 */
public enum ProductStatus {
    DRAFT,          // Created, fully editable — not visible to buyers
    PUBLISHED,      // Finalized details, partially editable (price, quantity) — visible to buyers
    PREMINTED,      // Item authentication payloads generated — immutable from here on
    LISTED,         // Available for purchase on marketplace
    SOLD_OUT,       // All items sold/reserved
    COMPLETED,      // All items delivered and ownership transferred
    // ...existing code...
}

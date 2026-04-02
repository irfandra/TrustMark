package com.digitalseal.model.entity;

/**
 * Order lifecycle status.
 * 
 * Flow: PENDING → PAYMENT_RECEIVED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
 * Can also go to CANCELLED or REFUNDED at certain stages.
 */
public enum OrderStatus {
    PENDING,            // Order created, awaiting payment
    PAYMENT_RECEIVED,   // Payment confirmed
    PROCESSING,         // Brand is preparing the item
    SHIPPED,            // Item shipped to buyer
    DELIVERED,          // (Optional) Manually confirmed as delivered — bypassed when buyer scans QR
    COMPLETED,          // Ownership finalized — triggered by QR scan OR brand manual completion
    CANCELLED,          // Order cancelled before fulfillment
    REFUNDED            // Payment refunded to buyer
}

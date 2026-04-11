package com.digitalseal.model.entity;

public enum ShipmentStatus {
    PENDING,
    PAYMENT_RECEIVED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    REFUNDED            // Payment refunded to buyer
}

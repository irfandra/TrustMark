package com.digitalseal.model.entity;

/**
 * Logical area of the platform that generated the log entry.
 */
public enum LogCategory {
    /** User registration, login, logout, token refresh, password reset */
    AUTH,
    /** Purchase orders: created, paid, processed, shipped, completed, cancelled */
    ORDER,
    /** QR-code claim events: purchased-item claims and standalone claims */
    CLAIM,
    /** Legacy integration category kept for compatibility with historical logs */
    BLOCKCHAIN,
    /** Product lifecycle: draft, publish, generate, list, update */
    PRODUCT,
    /** Brand management: create and update */
    BRAND,
    /** User profile updates and role changes */
    USER,
    /** Legacy wallet category kept for compatibility with historical logs */
    WALLET,
    /** Background jobs, startup, migrations, unclassified events */
    SYSTEM
}

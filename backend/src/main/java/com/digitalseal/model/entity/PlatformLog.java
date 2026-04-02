package com.digitalseal.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Persisted record of every significant platform event.
 * Used for monitoring, debugging, and historical audit trails.
 */
@Entity
@Table(name = "platform_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** When the event occurred */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** INFO / WARN / ERROR */
    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 10)
    private LogLevel level;

    /** Logical area: AUTH, ORDER, CLAIM, PRODUCT, … */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private LogCategory category;

    /** Short machine-readable action name, e.g. USER_LOGIN, ORDER_COMPLETED */
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    // ── Who ──────────────────────────────────────────────────────────────────

    /** User who triggered this event (null for anonymous/system events) */
    @Column(name = "user_id")
    private Long userId;

    /** Denormalized e-mail for quick display without JOIN */
    @Column(name = "user_email", length = 100)
    private String userEmail;

    // ── What entity was affected ───────────────────────────────────────────

    /** e.g. ORDER, PRODUCT_ITEM, BRAND */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** String representation of the primary key */
    @Column(name = "entity_id", length = 50)
    private String entityId;

    // ── Detail payload ────────────────────────────────────────────────────

    /** Human-readable or JSON description of what happened */
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    /** Full error message / stack summary — only for ERROR entries */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // ── HTTP context ──────────────────────────────────────────────────────

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "request_path", length = 500)
    private String requestPath;

    // ── Performance ───────────────────────────────────────────────────────

    /** How long the operation took in milliseconds */
    @Column(name = "duration_ms")
    private Long durationMs;

    /** false when the operation threw an exception or ended in an error state */
    @Column(name = "success", nullable = false)
    @Builder.Default
    private Boolean success = true;
}

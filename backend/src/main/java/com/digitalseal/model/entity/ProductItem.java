package com.digitalseal.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Represents a single authenticated unit of a product.
 */
@Entity
@Table(name = "product_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ProductItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    // Per-item serial number (e.g., "LV-SPEEDY-30-001", "LV-SPEEDY-30-002")
    @Column(name = "item_serial", nullable = false, unique = true, length = 150)
    private String itemSerial;
    
    // Sequence number within this product (1, 2, 3...)
    @Column(name = "item_index", nullable = false)
    private Integer itemIndex;
    
    @Column(name = "metadata_uri", length = 500)
    private String metadataUri;
    
    // Claim code for QR-based claiming
    @Column(name = "claim_code", unique = true, length = 64)
    private String claimCode;
    
    @Column(name = "claim_code_hash", length = 64)
    private String claimCodeHash;

    // Authentication QR payload for this item. Issued once and immutable.
    @Column(name = "certificate_qr_code", nullable = false, updatable = false, length = 255)
    private String certificateQrCode;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "seal_status", nullable = false, length = 20)
    @Builder.Default
    private SealStatus sealStatus = SealStatus.PRE_MINTED;
    
    // Ownership
    @Column(name = "current_owner_wallet", length = 42)
    private String currentOwnerWallet;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_owner_id")
    private User currentOwner;
    
    @Column(name = "minted_at")
    private LocalDateTime mintedAt;
    
    @Column(name = "sold_at")
    private LocalDateTime soldAt;
    
    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    private void ensureCertificateQrCode() {
        if (itemSerial != null
                && !itemSerial.isBlank()
                && (certificateQrCode == null || certificateQrCode.isBlank())) {
            certificateQrCode = "trustmark://certificate/" + itemSerial;
        }
    }
}

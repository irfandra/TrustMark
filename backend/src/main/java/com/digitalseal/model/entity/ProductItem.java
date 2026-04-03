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
    
    @Column(name = "item_serial", nullable = false, unique = true, length = 150)
    private String itemSerial;
    
    @Column(name = "item_index", nullable = false)
    private Integer itemIndex;

    @Column(name = "certificate_qr_code", nullable = false, updatable = false, length = 255)
    private String certificateQrCode;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private Boolean status = true;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;
    
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

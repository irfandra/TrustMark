package com.digitalseal.dto.response;

import com.digitalseal.model.entity.SealStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Product item response")
public class ProductItemResponse {
    
    @Schema(description = "Item ID", example = "1")
    private Long id;
    
    @Schema(description = "Product ID", example = "A1B2C3")
    private String productId;
    
    @Schema(description = "Product name", example = "Louis Vuitton Speedy 30")
    private String productName;
    
    @Schema(description = "Item serial number", example = "LV-SPEEDY-30-001")
    private String itemSerial;
    
    @Schema(description = "Index within the product", example = "1")
    private Integer itemIndex;
    
    @Schema(description = "Metadata URI")
    private String metadataUri;

    @Schema(description = "QR payload printed on certificate")
    private String certificateQrCode;
    
    @Schema(description = "Authentication status", example = "PRE_MINTED")
    private SealStatus sealStatus;
    
    @Schema(description = "Current owner wallet address")
    private String currentOwnerWallet;
    
    @Schema(description = "Current owner user ID")
    private Long currentOwnerId;

    @Schema(description = "Current owner username")
    private String currentOwnerUsername;
    
    @Schema(description = "When certificate QR was generated")
    private LocalDateTime mintedAt;
    
    @Schema(description = "When the item was sold")
    private LocalDateTime soldAt;
    
    @Schema(description = "When the item was claimed via QR")
    private LocalDateTime claimedAt;
    
    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
}

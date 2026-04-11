package com.digitalseal.dto.response;

import com.digitalseal.model.entity.ShipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Shipment information response")
public class ShipmentResponse {
    
    @Schema(description = "Shipment ID", example = "1")
    private Long id;
    
    @Schema(description = "Unique shipment number", example = "ORD-20260303-ABC123")
    private String orderNumber;
    
    @Schema(description = "Product ID", example = "A1B2C3")
    private String productId;
    
    @Schema(description = "Product name", example = "Louis Vuitton Speedy 30")
    private String productName;
    
    @Schema(description = "Product item ID (assigned after reservation)")
    private Long productItemId;
    
    @Schema(description = "Item serial number")
    private String itemSerial;

    @Schema(description = "Recipient display name", example = "John Doe")
    private String recipientName;

    @Schema(description = "Recipient phone number", example = "+1234567890")
    private String recipientPhoneNumber;

    @Schema(description = "Brand owner username", example = "hermesofficial")
    private String brandOwnerUsername;
    
    @Schema(description = "Shipment quantity", example = "1")
    private Integer quantity;
    
    @Schema(description = "Unit price in USD", example = "199.99")
    private BigDecimal unitPrice;
    
    @Schema(description = "Total price in USD", example = "199.99")
    private BigDecimal totalPrice;

    @Schema(description = "ISO 4217 currency code", example = "USD")
    private String currency;
    
    @Schema(description = "Shipment status", example = "PENDING")
    private ShipmentStatus status;
    
    @Schema(description = "Shipping address")
    private String shippingAddress;
    
    @Schema(description = "Tracking number")
    private String trackingNumber;
    
    @Schema(description = "When shipment was created")
    private LocalDateTime createdAt;
    
    @Schema(description = "When item was shipped")
    private LocalDateTime shippedAt;
    
    @Schema(description = "When item is estimated to arrive")
    private LocalDateTime estimatedAt;
    
    @Schema(description = "When shipment was completed")
    private LocalDateTime completedAt;

}

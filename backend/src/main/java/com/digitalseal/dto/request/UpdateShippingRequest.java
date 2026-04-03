package com.digitalseal.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Update order shipping information")
public class UpdateShippingRequest {
    
    @NotBlank(message = "Tracking number is required")
    @Schema(description = "Shipping tracking number", example = "1Z999AA10123456784")
    private String trackingNumber;

    @Schema(description = "Recipient full name", example = "John Doe")
    private String recipientName;

    @Schema(description = "Recipient phone number", example = "+1234567890")
    private String recipientPhone;

    @Schema(description = "Shipping destination address")
    private String shippingAddress;

    @Schema(description = "Estimated arrival datetime (ISO-8601)", example = "2026-04-05T14:30:00")
    private String estimatedAt;
}

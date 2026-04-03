package com.digitalseal.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
@Schema(description = "Activate product request")
public class PublishProductRequest {
    
    @NotNull(message = "Price is required to activate")
    @Schema(description = "Price per unit in USD", example = "199.99")
    private BigDecimal price;
}

package com.digitalseal.dto.request;

import com.digitalseal.model.entity.ProductCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import lombok.Data;

@Data
@Schema(description = "Create product request payload")
public class CreateProductRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 255, message = "Product name must be between 2 and 255 characters")
    @Schema(description = "Product name", example = "Louis Vuitton Speedy 30")
    private String productName;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    @Schema(description = "Product description", example = "Iconic monogram canvas handbag")
    private String description;
    
    @NotNull(message = "Category is required")
    @Schema(description = "Product category", example = "HANDBAG")
    private ProductCategory category;
    
    @NotBlank(message = "SKU is required")
    @Size(max = 100, message = "SKU must not exceed 100 characters")
    @Schema(description = "Stock Keeping Unit", example = "LV-SPEEDY-30-MONO")
    private String sku;
    
    @Size(max = 100, message = "Serial number must not exceed 100 characters")
    @Schema(description = "Unique serial number", example = "SN-2026-00001")
    private String serialNumber;
    
    @Schema(description = "Product image URL", example = "https://example.com/product.png")
    private String imageUrl;
    
    @Schema(description = "Collection ID to assign this product to (optional)", example = "1")
    private Long collectionId;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 8, message = "Invalid price format")
    @Schema(description = "Price per unit in cryptocurrency", example = "0.5")
    private BigDecimal price;
    
    @Size(max = 10, message = "Currency must not exceed 10 characters")
    @Schema(description = "Currency (default MATIC)", example = "MATIC")
    private String currency;
    
    @Min(value = 1, message = "Total quantity must be at least 1")
    @Schema(description = "Total number of units to produce", example = "100")
    private Integer totalQuantity;
}

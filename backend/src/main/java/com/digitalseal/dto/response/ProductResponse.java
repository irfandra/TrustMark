package com.digitalseal.dto.response;

import com.digitalseal.model.entity.ProductCategory;
import com.digitalseal.model.entity.ProductStatus;
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
@Schema(description = "Product information response")
public class ProductResponse {
    
    @Schema(description = "Product ID", example = "A1B2C3")
    private String id;
    
    @Schema(description = "Brand ID", example = "1")
    private Long brandId;
    
    @Schema(description = "Brand name", example = "Louis Vuitton")
    private String brandName;
    
    @Schema(description = "Collection ID (null if standalone)", example = "1")
    private Long collectionId;
    
    @Schema(description = "Collection name (null if standalone)", example = "Spring 2026 Collection")
    private String collectionName;
    
    @Schema(description = "Product name", example = "Louis Vuitton Speedy 30")
    private String productName;
    
    @Schema(description = "Product description", example = "Iconic monogram canvas handbag")
    private String description;
    
    @Schema(description = "Product category", example = "HANDBAG")
    private ProductCategory category;
    
    @Schema(description = "Product image URL", example = "https://example.com/product.png")
    private String imageUrl;
    
    @Schema(description = "Price per unit in USD", example = "199.99")
    private BigDecimal price;

    @Schema(description = "ISO 4217 currency code", example = "USD")
    private String currency;
    
    @Schema(description = "Total quantity to produce", example = "100")
    private Integer totalQuantity;
    
    @Schema(description = "Available quantity for purchase", example = "85")
    private Integer availableQuantity;
    
    @Schema(description = "Product lifecycle status", example = "DRAFT")
    private ProductStatus status;
    
    @Schema(description = "When product was listed on marketplace")
    private LocalDateTime listedAt;
    
    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
    
    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;
}

package com.digitalseal.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;

@Data
@Schema(description = "Create collection request payload")
public class CreateCollectionRequest {
    
    @NotBlank(message = "Collection name is required")
    @Size(min = 2, max = 255, message = "Collection name must be between 2 and 255 characters")
    @Schema(description = "Collection name", example = "Spring 2026 Collection")
    private String collectionName;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Schema(description = "Collection description", example = "Our exclusive spring lineup")
    private String description;
    
    @Schema(description = "Collection image URL", example = "https://example.com/collection.png")
    private String imageUrl;
    
    @Size(max = 100, message = "Season must not exceed 100 characters")
    @Schema(description = "Season identifier", example = "Spring 2026")
    private String season;
    
    @Schema(description = "Whether this is a limited edition collection", example = "false")
    private Boolean isLimitedEdition;
    
    @Schema(description = "Release date", example = "2026-04-01")
    private LocalDate releaseDate;
}

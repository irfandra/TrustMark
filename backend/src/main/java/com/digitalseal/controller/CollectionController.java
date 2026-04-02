package com.digitalseal.controller;

import com.digitalseal.dto.request.CreateCollectionRequest;
import com.digitalseal.dto.request.UpdateCollectionRequest;
import com.digitalseal.dto.response.ApiResponse;
import com.digitalseal.dto.response.CollectionResponse;
import com.digitalseal.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/brands/{brandId}/collections")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "Collection", description = "Collection management endpoints")
public class CollectionController {
    
    private final CollectionService collectionService;
    
    @Operation(
            summary = "Create a new collection",
            description = "Creates a new collection under a brand. Only the brand owner can create collections."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Collection created successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid input data"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Not the owner of this brand"
            )
    })
    @PostMapping
    public ResponseEntity<ApiResponse<CollectionResponse>> createCollection(
            @PathVariable Long brandId,
            @Valid @RequestBody CreateCollectionRequest request) {
        Long userId = null;
        log.info("Collection creation request for brand ID: {} from user ID: {}", brandId, userId);
        CollectionResponse response = collectionService.createCollection(userId, brandId, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Collection created successfully"));
    }
    
    @Operation(
            summary = "Get all collections for a brand",
            description = "Returns all collections for a brand. Publicly accessible."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Collections retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Brand not found"
            )
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<CollectionResponse>>> getCollections(@PathVariable Long brandId) {
        List<CollectionResponse> collections = collectionService.getCollectionsByBrand(brandId);
        return ResponseEntity.ok(ApiResponse.success(collections, "Collections retrieved successfully"));
    }
    
    @Operation(
            summary = "Get collection by ID",
            description = "Returns a specific collection with product count. Publicly accessible."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Collection retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Collection not found"
            )
    })
    @GetMapping("/{collectionId}")
    public ResponseEntity<ApiResponse<CollectionResponse>> getCollection(
            @PathVariable Long brandId,
            @PathVariable Long collectionId) {
        CollectionResponse response = collectionService.getCollectionById(collectionId);
        return ResponseEntity.ok(ApiResponse.success(response, "Collection retrieved successfully"));
    }
    
    @Operation(
            summary = "Update collection",
            description = "Updates collection details. Only the brand owner can update."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Collection updated successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Not the owner of this brand"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Collection not found"
            )
    })
    @PutMapping("/{collectionId}")
    public ResponseEntity<ApiResponse<CollectionResponse>> updateCollection(
            @PathVariable Long brandId,
            @PathVariable Long collectionId,
            @Valid @RequestBody UpdateCollectionRequest request) {
                Long userId = null;
        log.info("Collection update request for collection ID: {} under brand ID: {} from user ID: {}", collectionId, brandId, userId);
        CollectionResponse response = collectionService.updateCollection(userId, brandId, collectionId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Collection updated successfully"));
    }
    
    @Operation(
            summary = "Delete collection",
            description = "Deletes a collection. Products in this collection become standalone. Only the brand owner can delete."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Collection deleted successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Not the owner of this brand"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Collection not found"
            )
    })
    @DeleteMapping("/{collectionId}")
    public ResponseEntity<ApiResponse<Void>> deleteCollection(
            @PathVariable Long brandId,
            @PathVariable Long collectionId) {
                Long userId = null;
        log.info("Collection delete request for collection ID: {} under brand ID: {} from user ID: {}", collectionId, brandId, userId);
        collectionService.deleteCollection(userId, brandId, collectionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Collection deleted successfully"));
    }
}

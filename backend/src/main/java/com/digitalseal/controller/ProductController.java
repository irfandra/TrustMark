package com.digitalseal.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.digitalseal.dto.request.CreateProductRequest;
import com.digitalseal.dto.request.PublishProductRequest;
import com.digitalseal.dto.request.UpdateProductRequest;
import com.digitalseal.dto.response.ApiResponse;
import com.digitalseal.dto.response.ProductItemResponse;
import com.digitalseal.dto.response.ProductResponse;
import com.digitalseal.model.entity.ProductCategory;
import com.digitalseal.model.entity.ProductStatus;
import com.digitalseal.service.ProductItemService;
import com.digitalseal.service.ProductService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "Product", description = "Product management, lifecycle, and verification endpoints")
public class ProductController {
    
    private final ProductService productService;
    private final ProductItemService productItemService;
    
    
    @Operation(summary = "Register a new product", description = "Creates a new product under a brand with DRAFT status.")
    @PostMapping("/brands/{brandId}/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @PathVariable Long brandId,
            @Valid @RequestBody CreateProductRequest request) {
        Long userId = null;
        ProductResponse response = productService.createProduct(userId, brandId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Product created successfully"));
    }
    
    @Operation(summary = "Get products for a brand", description = "Returns all products for a brand with optional filters.")
    @GetMapping("/brands/{brandId}/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByBrand(
            @PathVariable Long brandId,
            @Parameter(description = "Filter by category") @RequestParam(required = false) ProductCategory category,
            @Parameter(description = "Filter by status") @RequestParam(required = false) ProductStatus status) {
        List<ProductResponse> products = productService.getProductsByBrand(brandId, category, status);
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }
    
    @Operation(summary = "Update a product", description = "DRAFT/INACTIVE: all fields editable. ACTIVE: only price is editable.")
    @PutMapping("/brands/{brandId}/products/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long brandId,
            @PathVariable String productId,
            @Valid @RequestBody UpdateProductRequest request) {
        Long userId = null;
        ProductResponse response = productService.updateProduct(userId, brandId, productId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Product updated successfully"));
    }
    
    @Operation(summary = "Delete a product", description = "Only DRAFT products can be deleted.")
    @DeleteMapping("/brands/{brandId}/products/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long brandId,
            @PathVariable String productId) {
        Long userId = null;
        productService.deleteProduct(userId, brandId, productId);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }
    
    
    @Operation(summary = "Activate a product", description = "DRAFT or INACTIVE -> ACTIVE.")
    @PostMapping("/brands/{brandId}/products/{productId}/publish")
    public ResponseEntity<ApiResponse<ProductResponse>> publishProduct(
            @PathVariable Long brandId,
            @PathVariable String productId,
            @Valid @RequestBody PublishProductRequest request) {
        Long userId = null;
        ProductResponse response = productService.publishProduct(userId, brandId, productId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Product activated successfully"));
    }
    
    @Operation(summary = "Mark product active", description = "Legacy endpoint. Marks product ACTIVE if stock is available.")
    @PostMapping("/brands/{brandId}/products/{productId}/list")
    public ResponseEntity<ApiResponse<ProductResponse>> listProduct(
            @PathVariable Long brandId,
            @PathVariable String productId) {
        Long userId = null;
        ProductResponse response = productService.listProduct(userId, brandId, productId);
        return ResponseEntity.ok(ApiResponse.success(response, "Product is active"));
    }
    
    
    @Operation(summary = "Get all items for a product", description = "Returns individual authenticated items for a product. Brand owner only.")
    @GetMapping("/brands/{brandId}/products/{productId}/items")
    public ResponseEntity<ApiResponse<List<ProductItemResponse>>> getProductItems(
            @PathVariable Long brandId,
            @PathVariable String productId) {
        productService.verifyBrandOwnership(null, brandId);
        List<ProductItemResponse> items = productItemService.getItemsByProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(items, "Product items retrieved"));
    }
    
    
    @Operation(summary = "Get product by ID", description = "Publicly accessible.")
    @GetMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable String productId) {
        ProductResponse response = productService.getProductById(productId);
        return ResponseEntity.ok(ApiResponse.success(response, "Product retrieved successfully"));
    }
    
    @Operation(summary = "Get products in a collection", description = "Publicly accessible.")
    @GetMapping("/collections/{collectionId}/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByCollection(@PathVariable Long collectionId) {
        List<ProductResponse> products = productService.getProductsByCollection(collectionId);
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }

    @Operation(summary = "Get product items by product ID", description = "Publicly accessible. Returns per-item serials sorted by item index.")
    @GetMapping("/products/{productId}/items")
    public ResponseEntity<ApiResponse<List<ProductItemResponse>>> getPublicProductItems(
            @PathVariable String productId) {
        List<ProductItemResponse> items = productItemService.getItemsByProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(items, "Product items retrieved successfully"));
    }
    
    @Operation(summary = "Get all product categories", description = "Publicly accessible.")
    @GetMapping("/products/categories")
    public ResponseEntity<ApiResponse<ProductCategory[]>> getCategories() {
        ProductCategory[] categories = productService.getCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved successfully"));
    }
}

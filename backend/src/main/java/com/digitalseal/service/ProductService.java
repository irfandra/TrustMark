package com.digitalseal.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digitalseal.dto.request.CreateProductRequest;
import com.digitalseal.dto.request.PremintProductRequest;
import com.digitalseal.dto.request.PublishProductRequest;
import com.digitalseal.dto.request.UpdateProductRequest;
import com.digitalseal.dto.response.ProductResponse;
import com.digitalseal.exception.InvalidStateException;
import com.digitalseal.exception.ResourceNotFoundException;
import com.digitalseal.model.entity.Brand;
import com.digitalseal.model.entity.Collection;
import com.digitalseal.model.entity.Product;
import com.digitalseal.model.entity.ProductCategory;
import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.model.entity.ProductStatus;
import com.digitalseal.repository.BrandRepository;
import com.digitalseal.repository.CollectionRepository;
import com.digitalseal.repository.ProductItemRepository;
import com.digitalseal.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {

    private static final String PRODUCT_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int PRODUCT_CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();
    
    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CollectionRepository collectionRepository;
    private final ProductItemRepository productItemRepository;
    
    @Transactional
    public ProductResponse createProduct(Long userId, Long brandId, CreateProductRequest request) {
        Brand brand = verifyBrandOwnership(userId, brandId);

        Collection collection = null;
        if (request.getCollectionId() != null) {
            collection = collectionRepository.findByIdAndBrandId(request.getCollectionId(), brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found or doesn't belong to this brand"));
        }
        
        Product product = Product.builder()
                .brand(brand)
                .collection(collection)
                .productCode(generateProductCode())
                .productName(request.getProductName())
                .description(request.getDescription())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .currency("USD")
                .status(ProductStatus.DRAFT)
                .build();

        if (request.getQuantity() != null && request.getQuantity() > 0) {
            generateProductItems(product, request.getQuantity());
        }
        
        Product saved = productRepository.save(Objects.requireNonNull(product, "product must not be null"));
        log.info("Product '{}' (Code: {}) created under brand ID: {} by user ID: {}",
            saved.getProductName(), saved.getProductCode(), brandId, userId);
        
        return mapToResponse(saved);
    }
    
    public List<ProductResponse> getProductsByBrand(Long brandId, ProductCategory category, ProductStatus status) {
        brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));
        
        List<Product> products;
        
        if (category != null && status != null) {
            products = productRepository.findByBrandIdAndCategoryAndStatus(brandId, category, status);
        } else if (category != null) {
            products = productRepository.findByBrandIdAndCategory(brandId, category);
        } else if (status != null) {
            products = productRepository.findByBrandIdAndStatus(brandId, status);
        } else {
            products = productRepository.findByBrandId(brandId);
        }
        
        return products.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<ProductResponse> getProductsByCollection(Long collectionId) {
        collectionRepository.findById(Objects.requireNonNull(collectionId, "collectionId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found"));
        
        return productRepository.findByCollectionId(collectionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public ProductResponse getProductById(String productId) {
        Product product = productRepository.findByProductCode(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return mapToResponse(product);
    }
    
    @Transactional
    public ProductResponse updateProduct(Long userId, Long brandId, String productId, UpdateProductRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() == ProductStatus.DRAFT || product.getStatus() == ProductStatus.INACTIVE) {
            if (request.getProductName() != null) product.setProductName(request.getProductName());
            if (request.getDescription() != null) product.setDescription(request.getDescription());
            if (request.getCategory() != null) product.setCategory(request.getCategory());
            if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
            if (request.getPrice() != null) product.setPrice(request.getPrice());
        } else if (product.getStatus() == ProductStatus.ACTIVE) {
            if (request.getPrice() != null) product.setPrice(request.getPrice());
            
            if (request.getProductName() != null || request.getDescription() != null || 
                request.getCategory() != null || request.getImageUrl() != null) {
                throw new InvalidStateException("Only price can be edited in ACTIVE status");
            }
        } else {
            throw new InvalidStateException("Product cannot be edited in " + product.getStatus() + " status");
        }
        
        Product updated = productRepository.save(Objects.requireNonNull(product, "product must not be null"));
        log.info("Product '{}' (ID: {}) updated by user ID: {}", updated.getProductName(), productId, userId);
        
        return mapToResponse(updated);
    }
    
    @Transactional
    public void deleteProduct(Long userId, Long brandId, String productId) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT products can be deleted. Current status: " + product.getStatus());
        }
        
        productRepository.delete(Objects.requireNonNull(product, "product must not be null"));
        log.info("Product '{}' (ID: {}) deleted by user ID: {}", product.getProductName(), productId, userId);
    }
    
    @Transactional
    public ProductResponse publishProduct(Long userId, Long brandId, String productId, PublishProductRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.DRAFT && product.getStatus() != ProductStatus.INACTIVE) {
            throw new InvalidStateException("Only DRAFT or INACTIVE products can be activated. Current status: " + product.getStatus());
        }
        
        product.setPrice(request.getPrice());
        product.setStatus(ProductStatus.ACTIVE);
        product.setListedAt(LocalDateTime.now());
        
        Product saved = productRepository.save(Objects.requireNonNull(product, "product must not be null"));
        log.info("Product '{}' (ID: {}) activated by user ID: {}", saved.getProductName(), productId, userId);
        
        return mapToResponse(saved);
    }
    
    @Transactional
    public ProductResponse premintProduct(Long userId, Long brandId, String productId, PremintProductRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new InvalidStateException("Only ACTIVE products can generate product items. Current status: " + product.getStatus());
        }
        
        if (product.getPrice() == null) {
            throw new InvalidStateException("Product must have a price set before pre-minting");
        }

        if (!product.getItems().isEmpty()) {
            throw new InvalidStateException("Product items already generated for this product");
        }

        int mintQuantity = request.getQuantity();

        generateProductItems(product, mintQuantity);
        product.setStatus(ProductStatus.ACTIVE);
        
        Product saved = productRepository.save(Objects.requireNonNull(product, "product must not be null"));
        
        log.info("Product '{}' (Code: {}) pre-minted with {} items by user ID: {}",
            saved.getProductName(), productId, mintQuantity, userId);
        
        return mapToResponse(saved);
    }
    
    @Transactional
    public ProductResponse listProduct(Long userId, Long brandId, String productId) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() == ProductStatus.DRAFT) {
            throw new InvalidStateException("DRAFT products must be activated first. Current status: " + product.getStatus());
        }

        long availableItems = productItemRepository.countByProductIdAndStatus(product.getId(), true);
        if (availableItems <= 0) {
            throw new InvalidStateException("Cannot list product without available pre-minted items");
        }
        
        product.setStatus(ProductStatus.ACTIVE);
        product.setListedAt(LocalDateTime.now());
        
        Product saved = productRepository.save(Objects.requireNonNull(product, "product must not be null"));
        log.info("Product '{}' (ID: {}) listed on marketplace by user ID: {}", saved.getProductName(), productId, userId);
        
        return mapToResponse(saved);
    }
    
    public ProductCategory[] getCategories() {
        return ProductCategory.values();
    }
    
    public Brand verifyBrandOwnership(Long userId, Long brandId) {
        Brand brand = brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));
        return brand;
    }
    
    public ProductResponse mapToResponse(Product product) {
        long totalQuantity = productItemRepository.countByProductId(product.getId());
        long availableQuantity = productItemRepository.countByProductIdAndStatus(product.getId(), true);

        return ProductResponse.builder()
                .id(product.getProductCode())
                .brandId(product.getBrand().getId())
                .brandName(product.getBrand().getBrandName())
                .collectionId(product.getCollection() != null ? product.getCollection().getId() : null)
                .collectionName(product.getCollection() != null ? product.getCollection().getCollectionName() : null)
                .productName(product.getProductName())
                .description(product.getDescription())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .price(product.getPrice())
                .currency(product.getCurrency() != null ? product.getCurrency() : "USD")
                .totalQuantity((int) totalQuantity)
                .availableQuantity((int) availableQuantity)
                .status(product.getStatus())
                .listedAt(product.getListedAt())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private String buildCertificateQrCode(String itemSerial) {
        return "trustmark://certificate/" + itemSerial;
    }

    private void generateProductItems(Product product, int mintQuantity) {
        for (int i = 1; i <= mintQuantity; i++) {
            String itemSerial = product.getProductCode() + "-" + String.format("%04d", i);

            ProductItem item = ProductItem.builder()
                    .product(product)
                    .itemSerial(itemSerial)
                    .itemIndex(i)
                    .certificateQrCode(buildCertificateQrCode(itemSerial))
                    .status(true)
                    .build();
            product.getItems().add(item);
        }
    }

    private String generateProductCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String candidate = randomCode(PRODUCT_CODE_LENGTH);
            if (!Boolean.TRUE.equals(productRepository.existsByProductCode(candidate))) {
                return candidate;
            }
        }

        String fallback = randomCode(PRODUCT_CODE_LENGTH - 1) + "Z";
        if (!Boolean.TRUE.equals(productRepository.existsByProductCode(fallback))) {
            return fallback;
        }
        throw new IllegalStateException("Failed to generate unique product code");
    }

    private String randomCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int idx = RANDOM.nextInt(PRODUCT_CODE_CHARS.length());
            builder.append(PRODUCT_CODE_CHARS.charAt(idx));
        }
        return builder.toString();
    }
}

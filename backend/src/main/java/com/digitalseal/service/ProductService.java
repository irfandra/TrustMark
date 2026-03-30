package com.digitalseal.service;

import java.math.BigInteger;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
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
import com.digitalseal.exception.UnauthorizedException;
import com.digitalseal.model.entity.Brand;
import com.digitalseal.model.entity.Collection;
import com.digitalseal.model.entity.Product;
import com.digitalseal.model.entity.ProductCategory;
import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.model.entity.ProductStatus;
import com.digitalseal.model.entity.SealStatus;
import com.digitalseal.repository.BrandRepository;
import com.digitalseal.repository.CollectionRepository;
import com.digitalseal.repository.ProductItemRepository;
import com.digitalseal.repository.ProductRepository;
import com.digitalseal.repository.UserRepository;

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
    private final UserRepository userRepository;
    private final BlockchainService blockchainService;
    
    /**
     * Register a new product under a brand (status = DRAFT)
     */
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
                .status(ProductStatus.DRAFT)
                .build();
        
        Product saved = productRepository.save(product);
        log.info("Product '{}' (Code: {}) created under brand ID: {} by user ID: {}",
            saved.getProductName(), saved.getProductCode(), brandId, userId);
        
        return mapToResponse(saved);
    }
    
    /**
     * Get all products for a brand with optional category and status filters (public)
     */
    public List<ProductResponse> getProductsByBrand(Long brandId, ProductCategory category, ProductStatus status) {
        brandRepository.findById(brandId)
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
    
    /**
     * Get products in a collection (public)
     */
    public List<ProductResponse> getProductsByCollection(Long collectionId) {
        collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found"));
        
        return productRepository.findByCollectionId(collectionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get a single product by ID (public)
     */
    public ProductResponse getProductById(String productId) {
        Product product = productRepository.findByProductCode(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return mapToResponse(product);
    }
    
    /**
     * Update a product. DRAFT: all fields editable. PUBLISHED: only price and quantity.
     */
    @Transactional
    public ProductResponse updateProduct(Long userId, Long brandId, String productId, UpdateProductRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() == ProductStatus.DRAFT) {
            // Full edit allowed in DRAFT
            if (request.getProductName() != null) product.setProductName(request.getProductName());
            if (request.getDescription() != null) product.setDescription(request.getDescription());
            if (request.getCategory() != null) product.setCategory(request.getCategory());
            if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
            if (request.getPrice() != null) product.setPrice(request.getPrice());
        } else if (product.getStatus() == ProductStatus.PUBLISHED) {
            // Only price editable in PUBLISHED
            if (request.getPrice() != null) product.setPrice(request.getPrice());
            
            // Reject changes to immutable fields
            if (request.getProductName() != null || request.getDescription() != null || 
                request.getCategory() != null || request.getImageUrl() != null) {
                throw new InvalidStateException("Only price can be edited in PUBLISHED status");
            }
        } else {
            throw new InvalidStateException("Product cannot be edited in " + product.getStatus() + " status");
        }
        
        Product updated = productRepository.save(product);
        log.info("Product '{}' (ID: {}) updated by user ID: {}", updated.getProductName(), productId, userId);
        
        return mapToResponse(updated);
    }
    
    /**
     * Delete a product (only DRAFT products can be deleted)
     */
    @Transactional
    public void deleteProduct(Long userId, Long brandId, String productId) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT products can be deleted. Current status: " + product.getStatus());
        }
        
        productRepository.delete(product);
        log.info("Product '{}' (ID: {}) deleted by user ID: {}", product.getProductName(), productId, userId);
    }
    
    /**
     * Publish a product: DRAFT → PUBLISHED. Locks core details, allows price/qty edits.
     */
    @Transactional
    public ProductResponse publishProduct(Long userId, Long brandId, String productId, PublishProductRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.DRAFT) {
            throw new InvalidStateException("Only DRAFT products can be published. Current status: " + product.getStatus());
        }
        
        product.setPrice(request.getPrice());
        if (request.getListingDeadline() != null) {
            product.setListingDeadline(request.getListingDeadline());
        }
        product.setStatus(ProductStatus.PUBLISHED);
        
        Product saved = productRepository.save(product);
        log.info("Product '{}' (ID: {}) published by user ID: {}", saved.getProductName(), productId, userId);
        
        return mapToResponse(saved);
    }
    
    /**
     * Pre-mint product: PUBLISHED → PREMINTED. Generates product items with claim codes.
     * In production, this would trigger blockchain minting. For now, it creates the items off-chain.
     */
    @Transactional
    public ProductResponse premintProduct(Long userId, Long brandId, String productId, PremintProductRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.PUBLISHED) {
            throw new InvalidStateException("Only PUBLISHED products can be pre-minted. Current status: " + product.getStatus());
        }
        
        if (product.getPrice() == null) {
            throw new InvalidStateException("Product must have a price set before pre-minting");
        }

        if (!product.getItems().isEmpty()) {
            throw new InvalidStateException("Product items already generated for this product");
        }

        int mintQuantity = request.getQuantity();
        
        // Generate product items (individual NFT units)
        for (int i = 1; i <= mintQuantity; i++) {
            String itemSerial = product.getProductCode() + "-" + String.format("%04d", i);
            String claimCode = generateClaimCode();

            ProductItem item = ProductItem.builder()
                    .product(product)
                .itemSerial(itemSerial)
                    .itemIndex(i)
                .claimCode(claimCode)
                .nftQrCode(buildNftQrCode(itemSerial))
                .productLabelQrCode(buildProductLabelQrCode(itemSerial, claimCode))
                .certificateQrCode(buildCertificateQrCode(itemSerial))
                    .sealStatus(SealStatus.PRE_MINTED)
                    .build();
            product.getItems().add(item);
        }

        product.setPremintedAt(LocalDateTime.now());
        product.setStatus(ProductStatus.PREMINTED);
        
        // Save product + items first (off-chain)
        Product saved = productRepository.save(product);
        
        // Trigger blockchain batch-minting (after items are persisted)
        if (blockchainService.isAvailable()) {
            try {
                String brandWallet = saved.getBrand().getCompanyWalletAddress();
                if (brandWallet == null || brandWallet.isBlank()) {
                    log.warn("Brand has no wallet address. Skipping on-chain minting.");
                } else {
                    List<String> serials = saved.getItems().stream()
                            .map(ProductItem::getItemSerial).collect(Collectors.toList());
                    List<String> metadataURIs = serials.stream()
                            .map(s -> "https://digitalseal.io/metadata/" + s).collect(Collectors.toList());
                    
                    // Convert price to wei (assuming price is in MATIC, 1 MATIC = 10^18 wei)
                    BigInteger priceWei = saved.getPrice().multiply(new java.math.BigDecimal("1000000000000000000")).toBigInteger();
                    
                    BlockchainService.BatchMintResult result = blockchainService.batchPreMint(
                            brandWallet, serials, metadataURIs, priceWei);
                    
                    if (result != null) {
                        saved.setContractAddress(System.getenv("CONTRACT_ADDRESS"));
                        
                        // Assign tokenIds and txHash to each item
                        BigInteger startTokenId = result.startTokenId();
                        for (int idx = 0; idx < saved.getItems().size(); idx++) {
                            ProductItem item = saved.getItems().get(idx);
                            if (startTokenId != null) {
                                item.setTokenId(startTokenId.longValue() + idx);
                            }
                            item.setMintTxHash(result.txHash());
                            item.setMintedAt(LocalDateTime.now());
                        }
                        saved = productRepository.save(saved);
                        log.info("Blockchain batch mint successful. TxHash: {}", result.txHash());
                    }
                }
            } catch (Exception e) {
                log.error("Blockchain minting failed but items created off-chain: {}", e.getMessage());
                // Don't fail the whole operation — items are created off-chain
            }
        } else {
            log.info("Blockchain not available. Items created off-chain only.");
        }
        
        log.info("Product '{}' (Code: {}) pre-minted with {} items by user ID: {}",
            saved.getProductName(), productId, mintQuantity, userId);
        
        return mapToResponse(saved);
    }
    
    /**
     * List product on marketplace: PREMINTED → LISTED.
     */
    @Transactional
    public ProductResponse listProduct(Long userId, Long brandId, String productId) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.PREMINTED) {
            throw new InvalidStateException("Only PREMINTED products can be listed. Current status: " + product.getStatus());
        }

        long availableItems = productItemRepository.countByProductIdAndSealStatus(product.getId(), SealStatus.PRE_MINTED);
        if (availableItems <= 0) {
            throw new InvalidStateException("Cannot list product without available pre-minted items");
        }
        
        product.setStatus(ProductStatus.LISTED);
        product.setListedAt(LocalDateTime.now());
        
        Product saved = productRepository.save(product);
        log.info("Product '{}' (ID: {}) listed on marketplace by user ID: {}", saved.getProductName(), productId, userId);
        
        return mapToResponse(saved);
    }
    
    /**
     * Delist product from marketplace: LISTED → DELISTED.
     */
    @Transactional
    public ProductResponse delistProduct(Long userId, Long brandId, String productId) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.LISTED && product.getStatus() != ProductStatus.SOLD_OUT) {
            throw new InvalidStateException("Only LISTED or SOLD_OUT products can be delisted. Current status: " + product.getStatus());
        }
        
        // DELISTED status removed: use appropriate fallback or remove
        // ...existing code...
        
        Product saved = productRepository.save(product);
        log.info("Product '{}' (ID: {}) delisted by user ID: {}", saved.getProductName(), productId, userId);
        
        return mapToResponse(saved);
    }
    
    /**
     * Archive a product: COMPLETED or DELISTED → ARCHIVED.
     */
    @Transactional
    public ProductResponse archiveProduct(Long userId, Long brandId, String productId) {
        verifyBrandOwnership(userId, brandId);
        
        Product product = productRepository.findByProductCodeAndBrandId(productId, brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or doesn't belong to this brand"));
        
        if (product.getStatus() != ProductStatus.COMPLETED) {
            throw new InvalidStateException("Only COMPLETED products can be archived. Current status: " + product.getStatus());
        }
        
        // ARCHIVED status removed: use appropriate fallback or remove
        // ...existing code...
        
        Product saved = productRepository.save(product);
        log.info("Product '{}' (ID: {}) archived by user ID: {}", saved.getProductName(), productId, userId);
        
        return mapToResponse(saved);
    }
    
    /**
     * Get all available product categories
     */
    public ProductCategory[] getCategories() {
        return ProductCategory.values();
    }
    
    /**
     * Verify the user owns the brand
     */
    public Brand verifyBrandOwnership(Long userId, Long brandId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));
        
        if (!brand.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You don't own this brand");
        }
        
        return brand;
    }
    
    public ProductResponse mapToResponse(Product product) {
        long totalQuantity = productItemRepository.countByProductId(product.getId());
        long availableQuantity = productItemRepository.countByProductIdAndSealStatus(product.getId(), SealStatus.PRE_MINTED);

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
            .totalQuantity((int) totalQuantity)
            .availableQuantity((int) availableQuantity)
                .contractAddress(product.getContractAddress())
                .metadataBaseUri(product.getMetadataBaseUri())
                .status(product.getStatus())
                .listedAt(product.getListedAt())
                .listingDeadline(product.getListingDeadline())
                .premintedAt(product.getPremintedAt())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
    
    private String generateClaimCode() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String buildNftQrCode(String itemSerial) {
        return "digitalseal://nft/" + itemSerial;
    }

    private String buildProductLabelQrCode(String itemSerial, String claimCode) {
        if (claimCode != null && !claimCode.isBlank()) {
            return claimCode;
        }
        return "digitalseal://label/" + itemSerial;
    }

    private String buildCertificateQrCode(String itemSerial) {
        return "digitalseal://certificate/" + itemSerial;
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

package com.digitalseal.service;

import com.digitalseal.dto.response.MarketplaceListingResponse;
import com.digitalseal.model.entity.Product;
import com.digitalseal.model.entity.ProductCategory;
import com.digitalseal.model.entity.SealStatus;
import com.digitalseal.repository.ProductItemRepository;
import com.digitalseal.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class MarketplaceService {
    
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;
    
    /**
     * Browse all listed products (paginated)
     */
    public Page<MarketplaceListingResponse> browseListings(Pageable pageable) {
        return productRepository.findListedProducts(pageable)
                .map(this::mapToListingResponse);
    }
    
    /**
     * Browse listed products by category (paginated)
     */
    public Page<MarketplaceListingResponse> browseByCategory(ProductCategory category, Pageable pageable) {
        return productRepository.findListedProductsByCategory(category, pageable)
                .map(this::mapToListingResponse);
    }
    
    /**
     * Browse listed products by brand (paginated)
     */
    public Page<MarketplaceListingResponse> browseByBrand(Long brandId, Pageable pageable) {
        return productRepository.findListedProductsByBrand(brandId, pageable)
                .map(this::mapToListingResponse);
    }
    
    /**
     * Search listed products by name (paginated)
     */
    public Page<MarketplaceListingResponse> searchListings(String query, Pageable pageable) {
        return productRepository.searchListedProducts(query, pageable)
                .map(this::mapToListingResponse);
    }
    
    private MarketplaceListingResponse mapToListingResponse(Product product) {
        long totalQuantity = productItemRepository.countByProductId(product.getId());
        long availableQuantity = productItemRepository.countByProductIdAndSealStatus(product.getId(), SealStatus.PRE_MINTED);

        return MarketplaceListingResponse.builder()
            .id(product.getProductCode())
                .productName(product.getProductName())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .category(product.getCategory())
                .price(product.getPrice())
            .availableQuantity((int) availableQuantity)
            .totalQuantity((int) totalQuantity)
                .brandId(product.getBrand().getId())
                .brandName(product.getBrand().getBrandName())
                .brandLogo(product.getBrand().getLogo())
                .collectionName(product.getCollection() != null ? product.getCollection().getCollectionName() : null)
                .status(product.getStatus())
                .listedAt(product.getListedAt())
                .listingDeadline(product.getListingDeadline())
                .brandVerified(product.getBrand().getVerified())
                .build();
    }
}

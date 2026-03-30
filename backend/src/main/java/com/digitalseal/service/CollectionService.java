package com.digitalseal.service;

import com.digitalseal.dto.request.CreateCollectionRequest;
import com.digitalseal.dto.request.UpdateCollectionRequest;
import com.digitalseal.dto.response.CollectionResponse;
import com.digitalseal.exception.UserAlreadyExistsException;
import com.digitalseal.model.entity.Brand;
import com.digitalseal.model.entity.Collection;
import com.digitalseal.model.entity.CollectionStatus;
import com.digitalseal.repository.BrandRepository;
import com.digitalseal.repository.CollectionRepository;
import com.digitalseal.repository.ProductRepository;
import com.digitalseal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionService {
    
    private final CollectionRepository collectionRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    
    /**
     * Create a new collection under a brand
     */
    @Transactional
    public CollectionResponse createCollection(Long userId, Long brandId, CreateCollectionRequest request) {
        Brand brand = verifyBrandOwnership(userId, brandId);
        
        // Check collection name uniqueness within the brand
        if (collectionRepository.existsByCollectionNameIgnoreCaseAndBrandId(request.getCollectionName(), brandId)) {
            throw new UserAlreadyExistsException("Collection name already exists for this brand");
        }
        
        Collection collection = Collection.builder()
                .brand(brand)
                .collectionName(request.getCollectionName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .season(request.getSeason())
                .isLimitedEdition(request.getIsLimitedEdition() != null ? request.getIsLimitedEdition() : false)
                .releaseDate(request.getReleaseDate())
            .status(request.getStatus() != null ? request.getStatus() : CollectionStatus.DRAFT)
            .tag(request.getTag())
            .salesEndAt(request.getSalesEndAt())
            .tagColor(request.getTagColor())
            .tagTextColor(request.getTagTextColor())
                .build();
        
        Collection saved = collectionRepository.save(collection);
        log.info("Collection '{}' created under brand ID: {} by user ID: {}", saved.getCollectionName(), brandId, userId);
        
        return mapToResponse(saved, 0L);
    }
    
    /**
     * Get all collections for a brand (public)
     */
    public List<CollectionResponse> getCollectionsByBrand(Long brandId) {
        // Verify brand exists
        brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        return collectionRepository.findByBrandId(brandId).stream()
                .map(c -> mapToResponse(c, productRepository.countByCollectionId(c.getId())))
                .collect(Collectors.toList());
    }
    
    /**
     * Get a specific collection by ID (public)
     */
    public CollectionResponse getCollectionById(Long collectionId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        
        long productCount = productRepository.countByCollectionId(collectionId);
        return mapToResponse(collection, productCount);
    }
    
    /**
     * Update a collection (only the brand owner can update)
     */
    @Transactional
    public CollectionResponse updateCollection(Long userId, Long brandId, Long collectionId, UpdateCollectionRequest request) {
        verifyBrandOwnership(userId, brandId);
        
        Collection collection = collectionRepository.findByIdAndBrandId(collectionId, brandId)
                .orElseThrow(() -> new RuntimeException("Collection not found or doesn't belong to this brand"));
        
        if (request.getCollectionName() != null) {
            if (!collection.getCollectionName().equalsIgnoreCase(request.getCollectionName()) &&
                collectionRepository.existsByCollectionNameIgnoreCaseAndBrandId(request.getCollectionName(), brandId)) {
                throw new UserAlreadyExistsException("Collection name already exists for this brand");
            }
            collection.setCollectionName(request.getCollectionName());
        }
        
        if (request.getDescription() != null) {
            collection.setDescription(request.getDescription());
        }
        if (request.getImageUrl() != null) {
            collection.setImageUrl(request.getImageUrl());
        }
        if (request.getSeason() != null) {
            collection.setSeason(request.getSeason());
        }
        if (request.getIsLimitedEdition() != null) {
            collection.setIsLimitedEdition(request.getIsLimitedEdition());
        }
        if (request.getReleaseDate() != null) {
            collection.setReleaseDate(request.getReleaseDate());
        }
        if (request.getStatus() != null) {
            collection.setStatus(request.getStatus());
        }
        if (request.getTag() != null) {
            collection.setTag(request.getTag());
        }
        if (request.getSalesEndAt() != null) {
            collection.setSalesEndAt(request.getSalesEndAt());
        }
        if (request.getTagColor() != null) {
            collection.setTagColor(request.getTagColor());
        }
        if (request.getTagTextColor() != null) {
            collection.setTagTextColor(request.getTagTextColor());
        }
        
        Collection updated = collectionRepository.save(collection);
        log.info("Collection '{}' updated by user ID: {}", updated.getCollectionName(), userId);
        
        long productCount = productRepository.countByCollectionId(collectionId);
        return mapToResponse(updated, productCount);
    }
    
    /**
     * Delete a collection. Products in this collection become standalone (collection_id = null).
     */
    @Transactional
    public void deleteCollection(Long userId, Long brandId, Long collectionId) {
        verifyBrandOwnership(userId, brandId);
        
        Collection collection = collectionRepository.findByIdAndBrandId(collectionId, brandId)
                .orElseThrow(() -> new RuntimeException("Collection not found or doesn't belong to this brand"));
        
        // Products FK has ON DELETE SET NULL, so they'll become standalone
        collectionRepository.delete(collection);
        log.info("Collection '{}' deleted by user ID: {}", collection.getCollectionName(), userId);
    }
    
    /**
     * Verify the user owns the brand
     */
    private Brand verifyBrandOwnership(Long userId, Long brandId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        if (!brand.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't own this brand");
        }
        
        return brand;
    }
    
    private CollectionResponse mapToResponse(Collection collection, Long productCount) {
        return CollectionResponse.builder()
                .id(collection.getId())
                .brandId(collection.getBrand().getId())
                .brandName(collection.getBrand().getBrandName())
            .brandLogo(collection.getBrand().getLogo())
                .collectionName(collection.getCollectionName())
                .description(collection.getDescription())
                .imageUrl(collection.getImageUrl())
                .season(collection.getSeason())
                .isLimitedEdition(collection.getIsLimitedEdition())
                .releaseDate(collection.getReleaseDate())
            .status(collection.getStatus())
            .tag(collection.getTag())
            .salesEndAt(collection.getSalesEndAt())
            .tagColor(collection.getTagColor())
            .tagTextColor(collection.getTagTextColor())
                .productCount(productCount)
            .itemsCount(productCount)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}

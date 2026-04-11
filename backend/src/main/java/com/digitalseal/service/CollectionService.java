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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionService {
    
    private final CollectionRepository collectionRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    
    @Transactional
    public CollectionResponse createCollection(Long userId, Long brandId, CreateCollectionRequest request) {
        Brand brand = verifyBrandOwnership(userId, brandId);
        
        if (collectionRepository.existsByCollectionNameIgnoreCaseAndBrandId(request.getCollectionName(), brandId)) {
            throw new UserAlreadyExistsException("Collection name already exists for this brand");
        }
        
        Collection collection = Collection.builder()
                .brand(brand)
                .collectionName(request.getCollectionName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .category(request.getCategory())
                .releaseDate(request.getReleaseDate())
            .status(request.getStatus() != null ? request.getStatus() : CollectionStatus.DRAFT)
            .tag(request.getTag())
                .build();
        
        Collection saved = collectionRepository.save(Objects.requireNonNull(collection, "collection must not be null"));
        log.info("Collection '{}' created under brand ID: {} by user ID: {}", saved.getCollectionName(), brandId, userId);
        
        return mapToResponse(saved, 0L);
    }
    
    public List<CollectionResponse> getCollectionsByBrand(Long brandId) {
        brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        return collectionRepository.findByBrandId(brandId).stream()
                .map(c -> mapToResponse(c, productRepository.countByCollectionId(c.getId())))
                .collect(Collectors.toList());
    }
    
    public CollectionResponse getCollectionById(Long collectionId) {
        Collection collection = collectionRepository.findById(Objects.requireNonNull(collectionId, "collectionId must not be null"))
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        
        long productCount = productRepository.countByCollectionId(collectionId);
        return mapToResponse(collection, productCount);
    }
    
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
        if (request.getCategory() != null) {
            collection.setCategory(request.getCategory());
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
        
        Collection updated = collectionRepository.save(Objects.requireNonNull(collection, "collection must not be null"));
        log.info("Collection '{}' updated by user ID: {}", updated.getCollectionName(), userId);
        
        long productCount = productRepository.countByCollectionId(collectionId);
        return mapToResponse(updated, productCount);
    }
    
    @Transactional
    public void deleteCollection(Long userId, Long brandId, Long collectionId) {
        verifyBrandOwnership(userId, brandId);
        
        Collection collection = collectionRepository.findByIdAndBrandId(collectionId, brandId)
                .orElseThrow(() -> new RuntimeException("Collection not found or doesn't belong to this brand"));
        
        collectionRepository.delete(Objects.requireNonNull(collection, "collection must not be null"));
        log.info("Collection '{}' deleted by user ID: {}", collection.getCollectionName(), userId);
    }
    
    private Brand verifyBrandOwnership(Long userId, Long brandId) {
        Brand brand = brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
                .orElseThrow(() -> new RuntimeException("Brand not found"));

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
                .category(collection.getCategory())
                .releaseDate(collection.getReleaseDate())
            .status(collection.getStatus())
            .tag(collection.getTag())
                .productCount(productCount)
            .itemsCount(productCount)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}

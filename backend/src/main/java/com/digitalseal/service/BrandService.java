package com.digitalseal.service;

import com.digitalseal.dto.request.CreateBrandRequest;
import com.digitalseal.dto.request.UpdateBrandRequest;
import com.digitalseal.dto.response.BrandResponse;
import com.digitalseal.exception.UserAlreadyExistsException;
import com.digitalseal.model.entity.Brand;
import com.digitalseal.repository.BrandRepository;
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
public class BrandService {
    
    private final BrandRepository brandRepository;
    
    @Transactional
    public BrandResponse createBrand(Long userId, CreateBrandRequest request) {
        if (brandRepository.existsByBrandNameIgnoreCase(request.getBrandName())) {
            throw new UserAlreadyExistsException("Brand name already taken");
        }
        
        Brand brand = Brand.builder()
                .brandName(request.getBrandName())
                .companyEmail(request.getCompanyEmail())
                .companyAddress(request.getCompanyAddress())
                .logo(request.getLogo())
            .companyBanner(request.getCompanyBanner())
            .personInChargeName(request.getPersonInChargeName())
            .personInChargeRole(request.getPersonInChargeRole())
            .personInChargeEmail(request.getPersonInChargeEmail())
            .personInChargePhone(request.getPersonInChargePhone())
                .description(request.getDescription())
                .verified(false)
                .build();
        
        Brand savedBrand = brandRepository.save(Objects.requireNonNull(brand, "brand must not be null"));
        log.info("Brand '{}' created by user ID: {}", savedBrand.getBrandName(), userId);
        
        return mapToBrandResponse(savedBrand);
    }
    
    public List<BrandResponse> getMyBrands(Long userId) {
        return brandRepository.findAll().stream()
                .map(this::mapToBrandResponse)
                .collect(Collectors.toList());
    }
    
    public BrandResponse getBrandById(Long brandId) {
        Brand brand = brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        return mapToBrandResponse(brand);
    }
    
    @Transactional
    public BrandResponse updateBrand(Long userId, Long brandId, UpdateBrandRequest request) {
        Brand brand = brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
            .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        if (request.getBrandName() != null) {
            if (!brand.getBrandName().equalsIgnoreCase(request.getBrandName()) && 
                brandRepository.existsByBrandNameIgnoreCase(request.getBrandName())) {
                throw new UserAlreadyExistsException("Brand name already taken");
            }
            brand.setBrandName(request.getBrandName());
        }
        
        if (request.getCompanyEmail() != null) {
            brand.setCompanyEmail(request.getCompanyEmail());
        }
        
        if (request.getCompanyAddress() != null) {
            brand.setCompanyAddress(request.getCompanyAddress());
        }
        
        if (request.getLogo() != null) {
            brand.setLogo(request.getLogo());
        }

        if (request.getCompanyBanner() != null) {
            brand.setCompanyBanner(request.getCompanyBanner());
        }

        if (request.getPersonInChargeName() != null) {
            brand.setPersonInChargeName(request.getPersonInChargeName());
        }

        if (request.getPersonInChargeRole() != null) {
            brand.setPersonInChargeRole(request.getPersonInChargeRole());
        }

        if (request.getPersonInChargeEmail() != null) {
            brand.setPersonInChargeEmail(request.getPersonInChargeEmail());
        }

        if (request.getPersonInChargePhone() != null) {
            brand.setPersonInChargePhone(request.getPersonInChargePhone());
        }
        
        if (request.getDescription() != null) {
            brand.setDescription(request.getDescription());
        }
        
        Brand updatedBrand = brandRepository.save(Objects.requireNonNull(brand, "brand must not be null"));
        log.info("Brand '{}' updated by user ID: {}", updatedBrand.getBrandName(), userId);
        
        return mapToBrandResponse(updatedBrand);
    }
    
    @Transactional
    public void deleteBrand(Long userId, Long brandId) {
        Brand brand = brandRepository.findById(Objects.requireNonNull(brandId, "brandId must not be null"))
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        brandRepository.delete(Objects.requireNonNull(brand, "brand must not be null"));
        log.info("Brand '{}' deleted by user ID: {}", brand.getBrandName(), userId);
    }
    
    private BrandResponse mapToBrandResponse(Brand brand) {
        String ownerName = brand.getPersonInChargeName();
        
        return BrandResponse.builder()
                .id(brand.getId())
                .brandName(brand.getBrandName())
                .companyEmail(brand.getCompanyEmail())
                .companyAddress(brand.getCompanyAddress())
                .logo(brand.getLogo())
                .companyBanner(brand.getCompanyBanner())
                .personInChargeName(brand.getPersonInChargeName())
                .personInChargeRole(brand.getPersonInChargeRole())
                .personInChargeEmail(brand.getPersonInChargeEmail())
                .personInChargePhone(brand.getPersonInChargePhone())
                .description(brand.getDescription())
                .verified(brand.getVerified())
                .ownerId(null)
                .ownerName(ownerName == null || ownerName.isBlank() ? null : ownerName)
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }
}

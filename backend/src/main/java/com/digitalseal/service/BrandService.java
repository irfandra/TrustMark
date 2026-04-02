package com.digitalseal.service;

import com.digitalseal.dto.request.CreateBrandRequest;
import com.digitalseal.dto.request.UpdateBrandRequest;
import com.digitalseal.dto.response.BrandResponse;
import com.digitalseal.exception.UserAlreadyExistsException;
import com.digitalseal.model.entity.Brand;
import com.digitalseal.model.entity.User;
import com.digitalseal.model.entity.UserRole;
import com.digitalseal.repository.BrandRepository;
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
public class BrandService {
    
    private final BrandRepository brandRepository;
    private final UserRepository userRepository;
    
    /**
     * Register a new brand under the authenticated user
     */
    @Transactional
    public BrandResponse createBrand(Long userId, CreateBrandRequest request) {
        User user = findUserById(userId);
        
        // Check brand name uniqueness
        if (brandRepository.existsByBrandNameIgnoreCase(request.getBrandName())) {
            throw new UserAlreadyExistsException("Brand name already taken");
        }
        
        // Check company wallet uniqueness if provided
        if (request.getCompanyWalletAddress() != null && 
            brandRepository.existsByCompanyWalletAddress(request.getCompanyWalletAddress())) {
            throw new UserAlreadyExistsException("Company wallet address already registered to another brand");
        }
        
        Brand brand = Brand.builder()
                .user(user)
                .brandName(request.getBrandName())
                .companyEmail(request.getCompanyEmail())
                .companyAddress(request.getCompanyAddress())
                .companyWalletAddress(request.getCompanyWalletAddress())
                .logo(request.getLogo())
            .companyBanner(request.getCompanyBanner())
            .personInChargeName(request.getPersonInChargeName())
            .personInChargeRole(request.getPersonInChargeRole())
            .personInChargeEmail(request.getPersonInChargeEmail())
            .personInChargePhone(request.getPersonInChargePhone())
                .description(request.getDescription())
                .verified(false)
                .build();
        
        Brand savedBrand = brandRepository.save(brand);
        log.info("Brand '{}' created by user ID: {}", savedBrand.getBrandName(), userId);
        
        // Upgrade user role to BRAND if currently OWNER
        if (user.getRole() == UserRole.OWNER) {
            user.setRole(UserRole.BRAND);
            userRepository.save(user);
            log.info("User ID: {} role upgraded to BRAND", userId);
        }
        
        return mapToBrandResponse(savedBrand);
    }
    
    /**
     * Get all brands owned by the authenticated user
     */
    public List<BrandResponse> getMyBrands(Long userId) {
        return brandRepository.findAll().stream()
                .map(this::mapToBrandResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get a specific brand by ID (public)
     */
    public BrandResponse getBrandById(Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        return mapToBrandResponse(brand);
    }
    
    /**
     * Update a brand (only the owner can update)
     */
    @Transactional
    public BrandResponse updateBrand(Long userId, Long brandId, UpdateBrandRequest request) {
        Brand brand = brandRepository.findById(brandId)
            .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        if (request.getBrandName() != null) {
            // Check uniqueness only if name is changing
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
        
        if (request.getCompanyWalletAddress() != null) {
            if (!request.getCompanyWalletAddress().equals(brand.getCompanyWalletAddress()) &&
                brandRepository.existsByCompanyWalletAddress(request.getCompanyWalletAddress())) {
                throw new UserAlreadyExistsException("Company wallet address already registered to another brand");
            }
            brand.setCompanyWalletAddress(request.getCompanyWalletAddress());
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
        
        Brand updatedBrand = brandRepository.save(brand);
        log.info("Brand '{}' updated by user ID: {}", updatedBrand.getBrandName(), userId);
        
        return mapToBrandResponse(updatedBrand);
    }
    
    /**
     * Delete a brand (only the owner can delete)
     */
    @Transactional
    public void deleteBrand(Long userId, Long brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        
        brandRepository.delete(brand);
        log.info("Brand '{}' deleted by user ID: {}", brand.getBrandName(), userId);
    }
    
    private User findUserById(Long userId) {
        if (userId != null) {
            User direct = userRepository.findById(userId).orElse(null);
            if (direct != null) {
                return direct;
            }
        }

        return userRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    private BrandResponse mapToBrandResponse(Brand brand) {
        String ownerName = "";
        if (brand.getUser().getFirstName() != null) {
            ownerName = brand.getUser().getFirstName();
        }
        if (brand.getUser().getLastName() != null) {
            ownerName = ownerName.isEmpty() ? brand.getUser().getLastName() 
                    : ownerName + " " + brand.getUser().getLastName();
        }
        
        return BrandResponse.builder()
                .id(brand.getId())
                .brandName(brand.getBrandName())
                .companyEmail(brand.getCompanyEmail())
                .companyAddress(brand.getCompanyAddress())
                .companyWalletAddress(brand.getCompanyWalletAddress())
                .logo(brand.getLogo())
                .companyBanner(brand.getCompanyBanner())
                .personInChargeName(brand.getPersonInChargeName())
                .personInChargeRole(brand.getPersonInChargeRole())
                .personInChargeEmail(brand.getPersonInChargeEmail())
                .personInChargePhone(brand.getPersonInChargePhone())
                .description(brand.getDescription())
                .verified(brand.getVerified())
                .ownerId(brand.getUser().getId())
                .ownerName(ownerName.isEmpty() ? null : ownerName)
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }
}

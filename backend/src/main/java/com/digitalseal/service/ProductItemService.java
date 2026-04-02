package com.digitalseal.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.digitalseal.dto.response.ProductItemResponse;
import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.repository.ProductItemRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductItemService {
    
    private final ProductItemRepository productItemRepository;
    
    /**
     * Get all items for a product
     */
    public List<ProductItemResponse> getItemsByProduct(String productId) {
        return productItemRepository.findByProductProductCodeOrderByItemIndexAsc(productId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    private ProductItemResponse mapToResponse(ProductItem item) {
        String certificateQrCode = item.getCertificateQrCode();
        if (certificateQrCode == null || certificateQrCode.isBlank()) {
            certificateQrCode = "trustmark://certificate/" + item.getItemSerial();
        }

        return ProductItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getProductCode())
                .productName(item.getProduct().getProductName())
                .itemSerial(item.getItemSerial())
                .itemIndex(item.getItemIndex())
                .metadataUri(item.getMetadataUri())
                .certificateQrCode(certificateQrCode)
                .sealStatus(item.getSealStatus())
                .currentOwnerWallet(item.getCurrentOwnerWallet())
                .currentOwnerId(item.getCurrentOwner() != null ? item.getCurrentOwner().getId() : null)
                .currentOwnerUsername(item.getCurrentOwner() != null ? item.getCurrentOwner().getUserName() : null)
                .mintedAt(item.getMintedAt())
                .soldAt(item.getSoldAt())
                .claimedAt(item.getClaimedAt())
                .createdAt(item.getCreatedAt())
                .build();
    }
}

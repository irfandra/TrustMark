package com.digitalseal.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digitalseal.dto.request.UpdateShippingRequest;
import com.digitalseal.dto.response.ShipmentResponse;
import com.digitalseal.exception.InvalidStateException;
import com.digitalseal.exception.ResourceNotFoundException;
import com.digitalseal.model.entity.Shipment;
import com.digitalseal.model.entity.ShipmentStatus;
import com.digitalseal.model.entity.Collection;
import com.digitalseal.model.entity.CollectionStatus;
import com.digitalseal.model.entity.Product;
import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.model.entity.ProductStatus;
import com.digitalseal.repository.ShipmentRepository;
import com.digitalseal.repository.ProductItemRepository;
import com.digitalseal.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;

    @Transactional
    public ShipmentResponse processShipment(Long userId, Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(Objects.requireNonNull(shipmentId, "shipmentId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));

        if (shipment.getStatus() != ShipmentStatus.PENDING && shipment.getStatus() != ShipmentStatus.PAYMENT_RECEIVED) {
            throw new InvalidStateException("Only PENDING or PAYMENT_RECEIVED shipments can be processed. Status: " + shipment.getStatus());
        }

        shipment.setStatus(ShipmentStatus.PROCESSING);
        Shipment saved = shipmentRepository.save(shipment);
        log.info("Shipment {} is now being processed", saved.getOrderNumber());
        return mapToResponse(saved);
    }

    @Transactional
    public ShipmentResponse shipShipment(Long userId, Long shipmentId, UpdateShippingRequest request) {
        Shipment shipment = shipmentRepository.findById(Objects.requireNonNull(shipmentId, "shipmentId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));

        Product product = shipment.getProduct();
        Collection collection = product != null ? product.getCollection() : null;
        if (collection == null || collection.getStatus() != CollectionStatus.ACTIVE) {
            throw new InvalidStateException("Only items from ACTIVE collections can be shipped.");
        }

        if (shipment.getStatus() != ShipmentStatus.PROCESSING && shipment.getStatus() != ShipmentStatus.PAYMENT_RECEIVED) {
            throw new InvalidStateException("Only PROCESSING or PAYMENT_RECEIVED shipments can be shipped. Status: " + shipment.getStatus());
        }

        shipment.setTrackingNumber(request.getTrackingNumber());
        if (request.getRecipientName() != null && !request.getRecipientName().isBlank()) {
            shipment.setRecipientName(request.getRecipientName());
        }
        if (request.getRecipientPhone() != null && !request.getRecipientPhone().isBlank()) {
            shipment.setRecipientPhoneNumber(request.getRecipientPhone());
        }
        if (request.getShippingAddress() != null && !request.getShippingAddress().isBlank()) {
            shipment.setShippingAddress(request.getShippingAddress());
        }
        if (request.getEstimatedAt() != null && !request.getEstimatedAt().isBlank()) {
            shipment.setEstimatedAt(parseEstimatedAt(request.getEstimatedAt()));
        }

        shipment.setShippedAt(LocalDateTime.now());
        shipment.setStatus(ShipmentStatus.SHIPPED);

        if (shipment.getProductItem() != null) {
            ProductItem item = shipment.getProductItem();
            item.setStatus(false);
            item.setShippedAt(LocalDateTime.now());
            productItemRepository.save(item);
        }

        Shipment saved = shipmentRepository.save(shipment);
        updateProductAvailabilityStatus(saved.getProduct());
        log.info("Shipment {} shipped with tracking: {}", saved.getOrderNumber(), saved.getTrackingNumber());
        return mapToResponse(saved);
    }

    @Transactional
    public ShipmentResponse completeShipment(Long userId, Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(Objects.requireNonNull(shipmentId, "shipmentId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));

        if (shipment.getStatus() != ShipmentStatus.SHIPPED && shipment.getStatus() != ShipmentStatus.DELIVERED) {
            throw new InvalidStateException("Shipment must be SHIPPED or DELIVERED to complete. Status: " + shipment.getStatus());
        }

        shipment.setCompletedAt(LocalDateTime.now());
        shipment.setStatus(ShipmentStatus.COMPLETED);

        if (shipment.getProductItem() != null) {
            ProductItem item = shipment.getProductItem();
            item.setStatus(false);
            item.setClaimedAt(LocalDateTime.now());
            productItemRepository.save(item);
        }

        Shipment saved = shipmentRepository.save(shipment);
        updateProductAvailabilityStatus(saved.getProduct());
        log.info("Shipment {} completed", saved.getOrderNumber());
        return mapToResponse(saved);
    }

    @Transactional
    public ShipmentResponse shipInStockItem(Long userId, Long productItemId, UpdateShippingRequest request) {
        ProductItem item = productItemRepository.findById(Objects.requireNonNull(productItemId, "productItemId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Product item not found"));

        Product product = item.getProduct();
        if (product == null) {
            throw new InvalidStateException("Product item has no associated product");
        }
        Collection collection = product.getCollection();
        if (collection == null || collection.getStatus() != CollectionStatus.ACTIVE) {
            throw new InvalidStateException("Only items from ACTIVE collections can be shipped.");
        }

        if (!Boolean.TRUE.equals(item.getStatus())) {
            throw new InvalidStateException("Product item is not in stock");
        }

        List<ShipmentStatus> activeStatuses = List.of(
                ShipmentStatus.PENDING,
                ShipmentStatus.PAYMENT_RECEIVED,
                ShipmentStatus.PROCESSING,
                ShipmentStatus.SHIPPED,
                ShipmentStatus.DELIVERED);

        if (Boolean.TRUE.equals(shipmentRepository.existsByProductItemIdAndStatusIn(productItemId, activeStatuses))) {
            throw new InvalidStateException("Product item already has an active shipment");
        }

        BigDecimal unitPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
        String currency = product.getCurrency() != null ? product.getCurrency() : "USD";

        Shipment shipmentRecord = Shipment.builder()
            .orderNumber(generateShipmentNumber())
                .product(product)
                .productItem(item)
                .recipientName(request.getRecipientName())
                .recipientPhoneNumber(request.getRecipientPhone())
                .shippingAddress(request.getShippingAddress())
                .quantity(1)
                .unitPrice(unitPrice)
                .totalPrice(unitPrice)
                .currency(currency)
                .trackingNumber(request.getTrackingNumber())
                .estimatedAt(parseEstimatedAt(request.getEstimatedAt()))
                .status(ShipmentStatus.SHIPPED)
                .shippedAt(LocalDateTime.now())
                .build();

        item.setStatus(false);
        item.setShippedAt(LocalDateTime.now());

        productItemRepository.save(item);
        Shipment saved = shipmentRepository.save(Objects.requireNonNull(shipmentRecord, "shipmentRecord must not be null"));
        updateProductAvailabilityStatus(product);

        log.info("In-stock item {} shipped via synthetic shipment {}", productItemId, saved.getOrderNumber());
        return mapToResponse(saved);
    }

    public ShipmentResponse getShipment(Long userId, Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(Objects.requireNonNull(shipmentId, "shipmentId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));
        return mapToResponse(shipment);
    }

    public Page<ShipmentResponse> getShipmentsByProduct(Long userId, String productId, Pageable pageable) {
        productRepository.findByProductCode(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return shipmentRepository.findByProductProductCode(productId, pageable)
                .map(this::mapToResponse);
    }

    private void updateProductAvailabilityStatus(Product product) {
        long availableItems = productItemRepository.countByProductIdAndStatus(product.getId(), true);
        if (availableItems == 0 && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.INACTIVE);
            productRepository.save(product);
        }
    }

    private String generateShipmentNumber() {
        String candidate = "ORD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        while (Boolean.TRUE.equals(shipmentRepository.existsByOrderNumber(candidate))) {
            candidate = "ORD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        }
        return candidate;
    }

    private LocalDateTime parseEstimatedAt(String rawEstimatedAt) {
        if (rawEstimatedAt == null || rawEstimatedAt.isBlank()) {
            return null;
        }

        try {
            return LocalDateTime.parse(rawEstimatedAt);
        } catch (DateTimeParseException ignored) {
        }

        try {
            return OffsetDateTime.parse(rawEstimatedAt).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            throw new InvalidStateException("Invalid estimatedAt format. Use ISO-8601 datetime.");
        }
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        String brandOwner = shipment.getProduct() != null && shipment.getProduct().getBrand() != null
                ? shipment.getProduct().getBrand().getBrandName()
                : null;

        return ShipmentResponse.builder()
                .id(shipment.getId())
                .orderNumber(shipment.getOrderNumber())
                .productId(shipment.getProduct() != null ? shipment.getProduct().getProductCode() : null)
                .productName(shipment.getProduct() != null ? shipment.getProduct().getProductName() : null)
                .productItemId(shipment.getProductItem() != null ? shipment.getProductItem().getId() : null)
                .itemSerial(shipment.getProductItem() != null ? shipment.getProductItem().getItemSerial() : null)
                .recipientName(shipment.getRecipientName())
                .recipientPhoneNumber(shipment.getRecipientPhoneNumber())
                .brandOwnerUsername(brandOwner)
                .quantity(shipment.getQuantity())
                .unitPrice(shipment.getUnitPrice())
                .totalPrice(shipment.getTotalPrice())
                .currency(shipment.getCurrency())
                .status(shipment.getStatus())
                .shippingAddress(shipment.getShippingAddress())
                .trackingNumber(shipment.getTrackingNumber())
                .createdAt(shipment.getCreatedAt())
                .shippedAt(shipment.getShippedAt())
                .estimatedAt(shipment.getEstimatedAt())
                .completedAt(shipment.getCompletedAt())
                .build();
    }
}

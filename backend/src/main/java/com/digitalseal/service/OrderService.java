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
import com.digitalseal.dto.response.OrderResponse;
import com.digitalseal.exception.InvalidStateException;
import com.digitalseal.exception.ResourceNotFoundException;
import com.digitalseal.model.entity.Order;
import com.digitalseal.model.entity.OrderStatus;
import com.digitalseal.model.entity.Collection;
import com.digitalseal.model.entity.CollectionStatus;
import com.digitalseal.model.entity.Product;
import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.model.entity.ProductStatus;
import com.digitalseal.repository.OrderRepository;
import com.digitalseal.repository.ProductItemRepository;
import com.digitalseal.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;

    @Transactional
    public OrderResponse processOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId, "orderId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PAYMENT_RECEIVED) {
            throw new InvalidStateException("Only PENDING or PAYMENT_RECEIVED orders can be processed. Status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.PROCESSING);
        Order saved = orderRepository.save(order);
        log.info("Order {} is now being processed", saved.getOrderNumber());
        return mapToResponse(saved);
    }

    @Transactional
    public OrderResponse shipOrder(Long userId, Long orderId, UpdateShippingRequest request) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId, "orderId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Product product = order.getProduct();
        Collection collection = product != null ? product.getCollection() : null;
        if (collection == null || collection.getStatus() != CollectionStatus.ACTIVE) {
            throw new InvalidStateException("Only items from ACTIVE collections can be shipped.");
        }

        if (order.getStatus() != OrderStatus.PROCESSING && order.getStatus() != OrderStatus.PAYMENT_RECEIVED) {
            throw new InvalidStateException("Only PROCESSING or PAYMENT_RECEIVED orders can be shipped. Status: " + order.getStatus());
        }

        order.setTrackingNumber(request.getTrackingNumber());
        if (request.getRecipientName() != null && !request.getRecipientName().isBlank()) {
            order.setRecipientName(request.getRecipientName());
        }
        if (request.getRecipientPhone() != null && !request.getRecipientPhone().isBlank()) {
            order.setRecipientPhoneNumber(request.getRecipientPhone());
        }
        if (request.getShippingAddress() != null && !request.getShippingAddress().isBlank()) {
            order.setShippingAddress(request.getShippingAddress());
        }
        if (request.getEstimatedAt() != null && !request.getEstimatedAt().isBlank()) {
            order.setEstimatedAt(parseEstimatedAt(request.getEstimatedAt()));
        }

        order.setShippedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.SHIPPED);

        if (order.getProductItem() != null) {
            ProductItem item = order.getProductItem();
            item.setStatus(false);
            item.setShippedAt(LocalDateTime.now());
            productItemRepository.save(item);
        }

        Order saved = orderRepository.save(order);
        updateProductAvailabilityStatus(saved.getProduct());
        log.info("Order {} shipped with tracking: {}", saved.getOrderNumber(), saved.getTrackingNumber());
        return mapToResponse(saved);
    }

    @Transactional
    public OrderResponse completeOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId, "orderId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.SHIPPED && order.getStatus() != OrderStatus.DELIVERED) {
            throw new InvalidStateException("Order must be SHIPPED or DELIVERED to complete. Status: " + order.getStatus());
        }

        order.setCompletedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.COMPLETED);

        if (order.getProductItem() != null) {
            ProductItem item = order.getProductItem();
            item.setStatus(false);
            item.setClaimedAt(LocalDateTime.now());
            productItemRepository.save(item);
        }

        Order saved = orderRepository.save(order);
        updateProductAvailabilityStatus(saved.getProduct());
        log.info("Order {} completed", saved.getOrderNumber());
        return mapToResponse(saved);
    }

    @Transactional
    public OrderResponse shipInStockItem(Long userId, Long productItemId, UpdateShippingRequest request) {
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

        List<OrderStatus> activeStatuses = List.of(
                OrderStatus.PENDING,
                OrderStatus.PAYMENT_RECEIVED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED);

        if (Boolean.TRUE.equals(orderRepository.existsByProductItemIdAndStatusIn(productItemId, activeStatuses))) {
            throw new InvalidStateException("Product item already has an active order");
        }

        BigDecimal unitPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
        String currency = product.getCurrency() != null ? product.getCurrency() : "USD";

        Order shipmentOrder = Order.builder()
                .orderNumber(generateOrderNumber())
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
                .status(OrderStatus.SHIPPED)
                .shippedAt(LocalDateTime.now())
                .build();

        item.setStatus(false);
        item.setShippedAt(LocalDateTime.now());

        productItemRepository.save(item);
        Order saved = orderRepository.save(Objects.requireNonNull(shipmentOrder, "shipmentOrder must not be null"));
        updateProductAvailabilityStatus(product);

        log.info("In-stock item {} shipped via synthetic order {}", productItemId, saved.getOrderNumber());
        return mapToResponse(saved);
    }

    public OrderResponse getOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId, "orderId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return mapToResponse(order);
    }

    public Page<OrderResponse> getOrdersByProduct(Long userId, String productId, Pageable pageable) {
        productRepository.findByProductCode(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return orderRepository.findByProductProductCode(productId, pageable)
                .map(this::mapToResponse);
    }

    private void updateProductAvailabilityStatus(Product product) {
        long availableItems = productItemRepository.countByProductIdAndStatus(product.getId(), true);
        if (availableItems == 0 && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.INACTIVE);
            productRepository.save(product);
        }
    }

    private String generateOrderNumber() {
        String candidate = "ORD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        while (Boolean.TRUE.equals(orderRepository.existsByOrderNumber(candidate))) {
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

    private OrderResponse mapToResponse(Order order) {
        String brandOwner = order.getProduct() != null && order.getProduct().getBrand() != null
                ? order.getProduct().getBrand().getBrandName()
                : null;

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .productId(order.getProduct() != null ? order.getProduct().getProductCode() : null)
                .productName(order.getProduct() != null ? order.getProduct().getProductName() : null)
                .productItemId(order.getProductItem() != null ? order.getProductItem().getId() : null)
                .itemSerial(order.getProductItem() != null ? order.getProductItem().getItemSerial() : null)
                .recipientName(order.getRecipientName())
                .recipientPhoneNumber(order.getRecipientPhoneNumber())
                .brandOwnerUsername(brandOwner)
                .quantity(order.getQuantity())
                .unitPrice(order.getUnitPrice())
                .totalPrice(order.getTotalPrice())
                .currency(order.getCurrency())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .trackingNumber(order.getTrackingNumber())
                .createdAt(order.getCreatedAt())
                .shippedAt(order.getShippedAt())
                .estimatedAt(order.getEstimatedAt())
                .completedAt(order.getCompletedAt())
                .build();
    }
}

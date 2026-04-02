package com.digitalseal.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digitalseal.dto.request.UpdateShippingRequest;
import com.digitalseal.dto.response.OrderResponse;
import com.digitalseal.exception.InvalidStateException;
import com.digitalseal.exception.ResourceNotFoundException;
import com.digitalseal.model.entity.LogCategory;
import com.digitalseal.model.entity.Order;
import com.digitalseal.model.entity.OrderStatus;
import com.digitalseal.model.entity.OwnershipHistory;
import com.digitalseal.model.entity.Product;
import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.model.entity.ProductStatus;
import com.digitalseal.model.entity.SealStatus;
import com.digitalseal.model.entity.TransferType;
import com.digitalseal.model.entity.User;
import com.digitalseal.repository.OrderRepository;
import com.digitalseal.repository.OwnershipHistoryRepository;
import com.digitalseal.repository.ProductItemRepository;
import com.digitalseal.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;
    private final OwnershipHistoryRepository ownershipHistoryRepository;
    private final PlatformLogService platformLogService;
    
    /**
     * Brand processes the order.
     * Supports direct collector request acceptance by auto-confirming payment:
     * PENDING (with buyer wallet) -> PAYMENT_RECEIVED -> PROCESSING.
     */
    @Transactional
    public OrderResponse processOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        // Verify brand ownership
        verifyBrandOwnerForOrder(userId, order);
        
        if (order.getStatus() == OrderStatus.PENDING) {
            String buyerWallet = order.getBuyerWallet();
            if (buyerWallet == null || buyerWallet.isBlank()) {
                throw new InvalidStateException("Buyer wallet is required before creator can accept request.");
            }

            if (order.getPaymentTxHash() == null || order.getPaymentTxHash().isBlank()) {
                order.setPaymentTxHash("AUTO_ACCEPTED_" + UUID.randomUUID().toString().replace("-", ""));
            }
            order.setPaymentConfirmedAt(LocalDateTime.now());
            order.setStatus(OrderStatus.PAYMENT_RECEIVED);
        }

        if (order.getStatus() != OrderStatus.PAYMENT_RECEIVED) {
            throw new InvalidStateException("Only PENDING or PAYMENT_RECEIVED orders can be processed. Status: " + order.getStatus());
        }
        
        order.setStatus(OrderStatus.PROCESSING);
        
        Order saved = orderRepository.save(order);
        log.info("Order {} is now being processed", order.getOrderNumber());

        platformLogService.info(LogCategory.ORDER, "ORDER_PROCESSING",
                userId, order.getProduct().getBrand().getUser().getEmail(),
                "ORDER", saved.getId().toString(),
                "Order: " + order.getOrderNumber());

        return mapToResponse(saved);
    }

    /**
     * Brand ships the order and provides tracking info
     */
    @Transactional
    public OrderResponse shipOrder(Long userId, Long orderId, UpdateShippingRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        verifyBrandOwnerForOrder(userId, order);
        
        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new InvalidStateException("Only PROCESSING orders can be shipped. Status: " + order.getStatus());
        }
        
        order.setTrackingNumber(request.getTrackingNumber());
        order.setShippedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.SHIPPED);
        
        Order saved = orderRepository.save(order);
        log.info("Order {} shipped with tracking: {}", order.getOrderNumber(), request.getTrackingNumber());

        platformLogService.info(LogCategory.ORDER, "ORDER_SHIPPED",
                userId, order.getProduct().getBrand().getUser().getEmail(),
                "ORDER", saved.getId().toString(),
                "Order: " + order.getOrderNumber() + " | Tracking: " + request.getTrackingNumber());

        return mapToResponse(saved);
    }

        /**
         * Ship an in-stock PRE_MINTED item directly from creator fulfillment.
         * Creates a shipment order in SHIPPED state for operational tracking.
         */
        @Transactional
        public OrderResponse shipInStockItem(Long userId, Long productItemId, UpdateShippingRequest request) {
        ProductItem item = productItemRepository.findById(productItemId)
            .orElseThrow(() -> new ResourceNotFoundException("Product item not found"));

        Product product = item.getProduct();
        verifyBrandOwnerForProductItem(userId, item);

        if (item.getSealStatus() != SealStatus.PRE_MINTED) {
            throw new InvalidStateException(
                "Only PRE_MINTED in-stock items can be shipped. Status: " + item.getSealStatus());
        }

        List<OrderStatus> activeStatuses = List.of(
            OrderStatus.PENDING,
            OrderStatus.PAYMENT_RECEIVED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED);

        if (orderRepository.existsByProductItemIdAndStatusIn(item.getId(), activeStatuses)) {
            throw new InvalidStateException("This product item already has an active shipment order.");
        }

        User shipmentOwner = product.getBrand().getUser();
        BigDecimal unitPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;

        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .product(product)
            .productItem(item)
            .buyer(shipmentOwner)
            .buyerWallet(product.getBrand().getCompanyWalletAddress())
            .quantity(1)
            .unitPrice(unitPrice)
            .totalPrice(unitPrice)
            .currency("USD")
            .paymentTxHash("CREATOR_SHIPMENT_" + UUID.randomUUID().toString().replace("-", ""))
            .paymentConfirmedAt(LocalDateTime.now())
            .trackingNumber(request.getTrackingNumber())
            .shippedAt(LocalDateTime.now())
            .status(OrderStatus.SHIPPED)
            .build();

        item.setSealStatus(SealStatus.RESERVED);
        productItemRepository.save(item);

        Order saved = orderRepository.save(order);
        log.info("In-stock item {} shipped directly with tracking {}", item.getItemSerial(), request.getTrackingNumber());

        platformLogService.info(
            LogCategory.ORDER,
            "ORDER_SHIPPED_DIRECT_IN_STOCK",
            userId,
            product.getBrand().getUser().getEmail(),
            "ORDER",
            saved.getId().toString(),
            "Order: " + saved.getOrderNumber() + " | Item: " + item.getItemSerial());

        return mapToResponse(saved);
        }
    
    /**
     * Complete the order manually — fallback for when the buyer does not scan the QR code.
     * Accepts SHIPPED or DELIVERED. The preferred path is buyer scanning the QR label.
     */
    @Transactional
    public OrderResponse completeOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        verifyBrandOwnerForOrder(userId, order);
        
        if (order.getStatus() != OrderStatus.SHIPPED && order.getStatus() != OrderStatus.DELIVERED) {
            throw new InvalidStateException(
                    "Order must be SHIPPED or DELIVERED to complete manually. Status: " + order.getStatus());
        }
        
        // Transfer the seal to buyer
        ProductItem item = order.getProductItem();
        if (item != null) {
            item.setSealStatus(SealStatus.REALIZED);
            item.setCurrentOwnerWallet(order.getBuyerWallet());
            item.setCurrentOwner(order.getBuyer());
            item.setSoldAt(LocalDateTime.now());
            productItemRepository.save(item);
            
            // Record ownership history
            OwnershipHistory history = OwnershipHistory.builder()
                    .productItem(item)
                    .fromWallet(order.getProduct().getBrand().getCompanyWalletAddress())
                    .toWallet(order.getBuyerWallet())
                    .transferType(TransferType.PURCHASE)
                    .notes("Order " + order.getOrderNumber())
                    .transferredAt(LocalDateTime.now())
                    .build();
            ownershipHistoryRepository.save(history);
        }
        
        order.setCompletedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.COMPLETED);
        
        Order saved = orderRepository.save(order);
        log.info("Order {} completed. Seal transferred to buyer wallet: {}",
                order.getOrderNumber(), order.getBuyerWallet());

        platformLogService.info(LogCategory.ORDER, "ORDER_COMPLETED",
                userId, order.getProduct().getBrand().getUser().getEmail(),
                "ORDER", saved.getId().toString(),
                "Order: " + order.getOrderNumber()
                + " | Buyer wallet: " + order.getBuyerWallet());
        
        // Check if all items are sold → update product status
        checkProductCompletion(order.getProduct());
        
        return mapToResponse(saved);
    }
    
    /**
     * Get order by ID (buyer sees their own orders)
     */
    public OrderResponse getOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        return mapToResponse(order);
    }
    
    /**
     * Get all orders for a product (brand owner only, paginated)
     */
    public Page<OrderResponse> getOrdersByProduct(Long userId, String productId, Pageable pageable) {
        productRepository.findByProductCode(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return orderRepository.findByProductProductCode(productId, pageable)
                .map(this::mapToResponse);
    }
    
    private void verifyBrandOwnerForOrder(Long userId, Order order) {
        // Ownership check intentionally bypassed for no-auth CRUD mode.
    }

    private void verifyBrandOwnerForProductItem(Long userId, ProductItem item) {
        // Ownership check intentionally bypassed for no-auth CRUD mode.
    }

    private String generateOrderNumber() {
        String candidate;
        do {
            String token = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
            candidate = "ORD-SHP-" + token;
        } while (Boolean.TRUE.equals(orderRepository.existsByOrderNumber(candidate)));

        return candidate;
    }
    
    private void checkProductCompletion(Product product) {
        long completedOrders = orderRepository.countByProductIdAndStatus(product.getId(), OrderStatus.COMPLETED);
        long totalItems = productItemRepository.countByProductId(product.getId());
        if (totalItems > 0 && completedOrders >= totalItems) {
            product.setStatus(ProductStatus.COMPLETED);
            productRepository.save(product);
            log.info("Product '{}' (ID: {}) is now COMPLETED — all items sold and delivered", 
                    product.getProductName(), product.getId());
        }
    }

    private String buildUserDisplayName(User user) {
        if (user == null) {
            return null;
        }

        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";

        String fullName = (firstName + " " + lastName).trim();
        if (!fullName.isEmpty()) {
            return fullName;
        }

        if (user.getUserName() != null && !user.getUserName().isBlank()) {
            return user.getUserName();
        }

        return user.getEmail();
    }
    
    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
            .productId(order.getProduct().getProductCode())
                .productName(order.getProduct().getProductName())
                .productItemId(order.getProductItem() != null ? order.getProductItem().getId() : null)
                .itemSerial(order.getProductItem() != null ? order.getProductItem().getItemSerial() : null)
                .buyerId(order.getBuyer().getId())
                .buyerUsername(order.getBuyer().getUserName())
                .buyerName(buildUserDisplayName(order.getBuyer()))
                .buyerPhoneNumber(order.getBuyer().getPhoneNumber())
                .brandOwnerUsername(order.getProduct().getBrand().getUser().getUserName())
                .buyerWallet(order.getBuyerWallet())
                .quantity(order.getQuantity())
                .unitPrice(order.getUnitPrice())
                .totalPrice(order.getTotalPrice())
                .currency(order.getCurrency() != null ? order.getCurrency() : "USD")
                .paymentTxHash(order.getPaymentTxHash())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .trackingNumber(order.getTrackingNumber())
                .createdAt(order.getCreatedAt())
                .paymentConfirmedAt(order.getPaymentConfirmedAt())
                .shippedAt(order.getShippedAt())
                .deliveredAt(order.getDeliveredAt())
                .completedAt(order.getCompletedAt())
                .cancelledAt(order.getCancelledAt())
                .cancellationReason(order.getCancellationReason())
                .build();
    }
}

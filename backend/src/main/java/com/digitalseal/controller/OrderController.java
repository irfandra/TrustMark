package com.digitalseal.controller;

import com.digitalseal.dto.request.UpdateShippingRequest;
import com.digitalseal.dto.response.ApiResponse;
import com.digitalseal.dto.response.OrderResponse;
import com.digitalseal.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/orders", "/shipments"})
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "Shipment", description = "Shipment management and fulfillment endpoints")
public class OrderController {
    
    private final OrderService orderService;
    
    @Operation(summary = "Get shipment by ID", description = "Get details of a specific shipment for creator workflow.")
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @PathVariable Long orderId) {
        Long userId = null;
        OrderResponse response = orderService.getOrder(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment retrieved"));
    }
    
    
    @Operation(summary = "Process shipment", description = "Brand accepts collector request and begins processing. Supports PENDING (auto payment accept with buyer wallet) or PAYMENT_RECEIVED → PROCESSING.")
    @PostMapping("/{orderId}/process")
    public ResponseEntity<ApiResponse<OrderResponse>> processOrder(
            @PathVariable Long orderId) {
        Long userId = null;
        OrderResponse response = orderService.processOrder(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment is being processed"));
    }
    
    @Operation(summary = "Ship shipment", description = "Brand ships the shipment with tracking info. PROCESSING → SHIPPED.")
    @PostMapping("/{orderId}/ship")
    public ResponseEntity<ApiResponse<OrderResponse>> shipOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateShippingRequest request) {
        Long userId = null;
        OrderResponse response = orderService.shipOrder(userId, orderId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment shipped"));
    }

    @Operation(
            summary = "Ship in-stock item",
                description = "Creator ships an in-stock product item directly. Generates a shipment record in SHIPPED state.")
    @PostMapping("/items/{productItemId}/ship")
    public ResponseEntity<ApiResponse<OrderResponse>> shipInStockItem(
            @PathVariable Long productItemId,
            @Valid @RequestBody UpdateShippingRequest request) {
        Long userId = null;
        OrderResponse response = orderService.shipInStockItem(userId, productItemId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "In-stock item shipped"));
    }
    
    @Operation(summary = "Complete shipment (manual fallback)",
            description = "Manually complete a SHIPPED or DELIVERED shipment. " +
                "This is a fallback for when QR claim is not performed.")
    @PostMapping("/{orderId}/complete")
    public ResponseEntity<ApiResponse<OrderResponse>> completeOrder(
            @PathVariable Long orderId) {
        Long userId = null;
        OrderResponse response = orderService.completeOrder(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment completed, ownership updated"));
    }
    
    @Operation(summary = "Get shipments for a product", description = "Brand owner views all shipments for their product.")
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByProduct(
            @PathVariable String productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = null;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<OrderResponse> orders = orderService.getOrdersByProduct(userId, productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders, "Product shipments retrieved"));
    }
}

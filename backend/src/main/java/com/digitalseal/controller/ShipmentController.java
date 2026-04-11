package com.digitalseal.controller;

import com.digitalseal.dto.request.UpdateShippingRequest;
import com.digitalseal.dto.response.ApiResponse;
import com.digitalseal.dto.response.ShipmentResponse;
import com.digitalseal.service.ShipmentService;
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
@RequestMapping("/shipments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "Shipment", description = "Shipment management and fulfillment endpoints")
public class ShipmentController {
    
    private final ShipmentService shipmentService;
    
    @Operation(summary = "Get shipment by ID", description = "Get details of a specific shipment for creator workflow.")
    @GetMapping("/{shipmentId}")
    public ResponseEntity<ApiResponse<ShipmentResponse>> getShipment(
            @PathVariable Long shipmentId) {
        Long userId = null;
        ShipmentResponse response = shipmentService.getShipment(userId, shipmentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment retrieved"));
    }
    
    
    @Operation(summary = "Process shipment", description = "Brand accepts collector request and begins processing. Supports PENDING (auto payment accept with buyer wallet) or PAYMENT_RECEIVED → PROCESSING.")
    @PostMapping("/{shipmentId}/process")
    public ResponseEntity<ApiResponse<ShipmentResponse>> processShipment(
            @PathVariable Long shipmentId) {
        Long userId = null;
        ShipmentResponse response = shipmentService.processShipment(userId, shipmentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment is being processed"));
    }
    
    @Operation(summary = "Ship shipment", description = "Brand ships the shipment with tracking info. PROCESSING → SHIPPED.")
    @PostMapping("/{shipmentId}/ship")
    public ResponseEntity<ApiResponse<ShipmentResponse>> shipShipment(
            @PathVariable Long shipmentId,
            @Valid @RequestBody UpdateShippingRequest request) {
        Long userId = null;
        ShipmentResponse response = shipmentService.shipShipment(userId, shipmentId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment shipped"));
    }

    @Operation(
            summary = "Ship in-stock item",
                description = "Creator ships an in-stock product item directly. Generates a shipment record in SHIPPED state.")
    @PostMapping("/items/{productItemId}/ship")
    public ResponseEntity<ApiResponse<ShipmentResponse>> shipInStockItem(
            @PathVariable Long productItemId,
            @Valid @RequestBody UpdateShippingRequest request) {
        Long userId = null;
        ShipmentResponse response = shipmentService.shipInStockItem(userId, productItemId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "In-stock item shipped"));
    }
    
    @Operation(summary = "Complete shipment (manual fallback)",
            description = "Manually complete a SHIPPED or DELIVERED shipment. " +
                "This is a fallback for when QR claim is not performed.")
    @PostMapping("/{shipmentId}/complete")
    public ResponseEntity<ApiResponse<ShipmentResponse>> completeShipment(
            @PathVariable Long shipmentId) {
        Long userId = null;
        ShipmentResponse response = shipmentService.completeShipment(userId, shipmentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Shipment completed, ownership updated"));
    }
    
    @Operation(summary = "Get shipments for a product", description = "Brand owner views all shipments for their product.")
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ShipmentResponse>>> getShipmentsByProduct(
            @PathVariable String productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = null;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<ShipmentResponse> shipments = shipmentService.getShipmentsByProduct(userId, productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(shipments, "Product shipments retrieved"));
    }
}

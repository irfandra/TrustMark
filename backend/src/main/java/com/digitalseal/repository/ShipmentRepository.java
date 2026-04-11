package com.digitalseal.repository;

import com.digitalseal.model.entity.Shipment;
import com.digitalseal.model.entity.ShipmentStatus;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    
    Optional<Shipment> findByOrderNumber(String orderNumber);

    Page<Shipment> findByProductProductCode(String productCode, Pageable pageable);
    
    long countByProductId(Long productId);
    
    long countByProductIdAndStatus(Long productId, ShipmentStatus status);

    Boolean existsByProductItemIdAndStatusIn(Long productItemId, Collection<ShipmentStatus> statuses);
    
    Boolean existsByOrderNumber(String orderNumber);
}

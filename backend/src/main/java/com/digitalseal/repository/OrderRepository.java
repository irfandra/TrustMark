package com.digitalseal.repository;

import com.digitalseal.model.entity.Order;
import com.digitalseal.model.entity.OrderStatus;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByProductProductCode(String productCode, Pageable pageable);
    
    long countByProductId(Long productId);
    
    long countByProductIdAndStatus(Long productId, OrderStatus status);

    Boolean existsByProductItemIdAndStatusIn(Long productItemId, Collection<OrderStatus> statuses);
    
    Boolean existsByOrderNumber(String orderNumber);
}

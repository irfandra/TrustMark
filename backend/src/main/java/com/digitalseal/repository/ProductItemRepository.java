package com.digitalseal.repository;

import com.digitalseal.model.entity.ProductItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductItemRepository extends JpaRepository<ProductItem, Long> {
    
    List<ProductItem> findByProductId(Long productId);

    List<ProductItem> findByProductProductCode(String productCode);

    List<ProductItem> findByProductProductCodeOrderByItemIndexAsc(String productCode);

    List<ProductItem> findByProductIdAndStatus(Long productId, Boolean status);
    
    Optional<ProductItem> findByItemSerial(String itemSerial);
    
    Optional<ProductItem> findByIdAndProductId(Long id, Long productId);
    
    long countByProductId(Long productId);
    
    long countByProductIdAndStatus(Long productId, Boolean status);

    Optional<ProductItem> findFirstByProductIdAndStatusTrueOrderByItemIndexAsc(Long productId);
}

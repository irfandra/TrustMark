package com.digitalseal.repository;

import com.digitalseal.model.entity.ProductItem;
import com.digitalseal.model.entity.SealStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductItemRepository extends JpaRepository<ProductItem, Long> {
    
    List<ProductItem> findByProductId(Long productId);

    List<ProductItem> findByProductProductCode(String productCode);

    List<ProductItem> findByProductProductCodeOrderByItemIndexAsc(String productCode);

    List<ProductItem> findByProductIdAndSealStatus(Long productId, SealStatus sealStatus);
    
    Optional<ProductItem> findByItemSerial(String itemSerial);
    
    Optional<ProductItem> findByTokenId(Long tokenId);
    
    Optional<ProductItem> findByClaimCode(String claimCode);
    
    Optional<ProductItem> findByIdAndProductId(Long id, Long productId);
    
    List<ProductItem> findByCurrentOwnerId(Long userId);
    
    long countByProductId(Long productId);
    
    long countByProductIdAndSealStatus(Long productId, SealStatus sealStatus);
    
    @Query("SELECT pi FROM ProductItem pi WHERE pi.product.id = :productId AND pi.sealStatus = 'PRE_MINTED' ORDER BY pi.itemIndex ASC LIMIT 1")
    Optional<ProductItem> findFirstAvailableItem(@Param("productId") Long productId);
}

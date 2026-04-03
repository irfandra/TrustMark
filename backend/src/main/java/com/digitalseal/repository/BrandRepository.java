package com.digitalseal.repository;

import com.digitalseal.model.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    Boolean existsByBrandNameIgnoreCase(String brandName);
}

-- Create brands table
CREATE TABLE brands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Owner reference
    user_id BIGINT NOT NULL,
    
    -- Brand Information
    brand_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NULL,
    company_address TEXT NULL,
    company_wallet_address VARCHAR(42) NULL,
    logo VARCHAR(500) NULL,
    company_banner VARCHAR(500) NULL,
    statement_letter_url VARCHAR(500) NULL,
    person_in_charge_name VARCHAR(255) NULL,
    person_in_charge_role VARCHAR(255) NULL,
    person_in_charge_email VARCHAR(255) NULL,
    person_in_charge_phone VARCHAR(30) NULL,
    description TEXT NULL,
    
    -- Status
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_brands_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_brands_user_id (user_id),
    INDEX idx_brands_brand_name (brand_name),
    
    -- Unique Constraints
    UNIQUE KEY unique_brand_name (brand_name),
    UNIQUE KEY unique_company_wallet (company_wallet_address)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

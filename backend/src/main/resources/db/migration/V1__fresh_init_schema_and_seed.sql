-- V1 fresh baseline for TrustMark
-- Consolidated from legacy V1..V21 migrations for clean database initialization.


-- ===== BEGIN V1__create_users_table.sql =====

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Basic Info
    email VARCHAR(255) NULL,
    password_hash VARCHAR(255) NULL,
    
    -- Wallet Info
    wallet_address VARCHAR(42) NULL,
    wallet_nonce VARCHAR(255) NULL,
    
    -- Profile Information
    full_name VARCHAR(255) NULL,
    phone_number VARCHAR(20) NULL,
    
    -- Authentication & Role
    auth_type VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    role VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    
    -- Status Flags
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    wallet_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Security
    failed_login_attempts INT NOT NULL DEFAULT 0,
    last_failed_login_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_auth_type (auth_type),
    INDEX idx_role (role),
    
    -- Unique Constraints
    UNIQUE KEY unique_email (email),
    UNIQUE KEY unique_wallet (wallet_address),
    
    -- Check Constraints
    CONSTRAINT chk_auth_email CHECK (
        auth_type != 'EMAIL' OR (email IS NOT NULL AND password_hash IS NOT NULL)
    ),
    CONSTRAINT chk_auth_wallet CHECK (
        auth_type != 'WALLET' OR wallet_address IS NOT NULL
    ),
    CONSTRAINT chk_auth_both CHECK (
        auth_type != 'BOTH' OR (email IS NOT NULL AND wallet_address IS NOT NULL)
    )
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V1__create_users_table.sql =====

-- ===== BEGIN V2__create_refresh_tokens_table.sql =====

-- Create refresh tokens table
CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- Token Information
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- Device Information
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    
    -- Status
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V2__create_refresh_tokens_table.sql =====

-- ===== BEGIN V3__split_fullname_into_first_last.sql =====

-- Split full_name into first_name and last_name
ALTER TABLE users ADD COLUMN first_name VARCHAR(255) NULL AFTER wallet_nonce;
ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name;

-- Migrate existing data: put full_name into first_name
UPDATE users SET first_name = full_name WHERE full_name IS NOT NULL;

-- Drop old column
ALTER TABLE users DROP COLUMN full_name;


-- ===== END V3__split_fullname_into_first_last.sql =====

-- ===== BEGIN V4__create_brands_table.sql =====

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


-- ===== END V4__create_brands_table.sql =====

-- ===== BEGIN V5__create_verification_codes_table.sql =====

-- Create verification codes table
CREATE TABLE verification_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- User reference
    user_id BIGINT NOT NULL,
    
    -- Code details
    code VARCHAR(6) NOT NULL,
    type VARCHAR(30) NOT NULL,
    
    -- Expiry & usage
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_verification_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_verification_user_id (user_id),
    INDEX idx_verification_code (code),
    INDEX idx_verification_type (type),
    INDEX idx_verification_expires (expires_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V5__create_verification_codes_table.sql =====

-- ===== BEGIN V6__create_collections_and_products_tables.sql =====

-- Create collections table
CREATE TABLE collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Brand reference
    brand_id BIGINT NOT NULL,
    
    -- Collection details
    collection_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    season VARCHAR(100),
    is_limited_edition BOOLEAN NOT NULL DEFAULT FALSE,
    release_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_collections_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_collections_brand_id (brand_id),
    INDEX idx_collections_season (season)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create products table
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Brand & collection reference
    brand_id BIGINT NOT NULL,
    collection_id BIGINT,
    
    -- Product details
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    image_url VARCHAR(500),
    
    -- Blockchain fields
    token_id VARCHAR(255),
    contract_address VARCHAR(42),
    metadata_uri VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    current_owner_wallet VARCHAR(42),
    minted_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
    
    -- Unique constraints
    CONSTRAINT uk_products_sku UNIQUE (sku),
    CONSTRAINT uk_products_serial_number UNIQUE (serial_number),
    
    -- Indexes
    INDEX idx_products_brand_id (brand_id),
    INDEX idx_products_collection_id (collection_id),
    INDEX idx_products_category (category),
    INDEX idx_products_status (status),
    INDEX idx_products_token_id (token_id),
    INDEX idx_products_sku (sku)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V6__create_collections_and_products_tables.sql =====

-- ===== BEGIN V7__alter_products_add_pricing_and_quantity.sql =====

-- V7: Alter products table — add pricing, quantity, listing, and update blockchain fields
-- Remove old single-item blockchain columns, add multi-item support
-- NOTE: Rewritten for idempotency after partial apply on MySQL (DDL is non-transactional)

-- Column changes (safe: use stored procedure to skip if already applied)
DROP PROCEDURE IF EXISTS migrate_v7;
DELIMITER //
CREATE PROCEDURE migrate_v7()
BEGIN
    -- Add pricing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE products ADD COLUMN price DECIMAL(18,8) DEFAULT NULL AFTER image_url;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'currency') THEN
        ALTER TABLE products ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'MATIC' AFTER price;
    END IF;

    -- Add quantity columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'total_quantity') THEN
        ALTER TABLE products ADD COLUMN total_quantity INT NOT NULL DEFAULT 1 AFTER currency;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'available_quantity') THEN
        ALTER TABLE products ADD COLUMN available_quantity INT NOT NULL DEFAULT 0 AFTER total_quantity;
    END IF;

    -- Rename metadata_uri → metadata_base_uri
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'metadata_uri') THEN
        ALTER TABLE products CHANGE COLUMN metadata_uri metadata_base_uri VARCHAR(500);
    END IF;

    -- Add listing fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'listed_at') THEN
        ALTER TABLE products ADD COLUMN listed_at TIMESTAMP NULL AFTER status;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'listing_deadline') THEN
        ALTER TABLE products ADD COLUMN listing_deadline TIMESTAMP NULL AFTER listed_at;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'preminted_at') THEN
        ALTER TABLE products ADD COLUMN preminted_at TIMESTAMP NULL AFTER listing_deadline;
    END IF;

    -- Drop old single-item columns (moved to product_items table)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'token_id') THEN
        ALTER TABLE products DROP COLUMN token_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'current_owner_wallet') THEN
        ALTER TABLE products DROP COLUMN current_owner_wallet;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'minted_at') THEN
        ALTER TABLE products DROP COLUMN minted_at;
    END IF;

    -- Add indexes for marketplace queries (skip if exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_price') THEN
        CREATE INDEX idx_products_price ON products (price);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_listed_at') THEN
        CREATE INDEX idx_products_listed_at ON products (listed_at);
    END IF;
END //
DELIMITER ;

CALL migrate_v7();
DROP PROCEDURE IF EXISTS migrate_v7;


-- ===== END V7__alter_products_add_pricing_and_quantity.sql =====

-- ===== BEGIN V8__create_product_items_table.sql =====

-- V8: Create product_items table — individual NFT units per product

CREATE TABLE IF NOT EXISTS product_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Product reference
    product_id BIGINT NOT NULL,
    
    -- Item identification
    item_serial VARCHAR(150) NOT NULL,
    item_index INT NOT NULL,
    
    -- Blockchain fields
    token_id BIGINT,
    metadata_uri VARCHAR(500),
    mint_tx_hash VARCHAR(66),
    
    -- Claim code for QR-based claiming
    claim_code VARCHAR(64),
    claim_code_hash VARCHAR(64),
    
    -- Seal status
    seal_status VARCHAR(20) NOT NULL DEFAULT 'PRE_MINTED',
    
    -- Current ownership
    current_owner_wallet VARCHAR(42),
    current_owner_id BIGINT,
    
    -- Transfer tracking
    transfer_tx_hash VARCHAR(66),
    
    -- Timestamps
    minted_at TIMESTAMP NULL,
    sold_at TIMESTAMP NULL,
    claimed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_product_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_items_owner FOREIGN KEY (current_owner_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraints
    CONSTRAINT uk_product_items_serial UNIQUE (item_serial),
    CONSTRAINT uk_product_items_claim_code UNIQUE (claim_code),
    CONSTRAINT uk_product_items_product_index UNIQUE (product_id, item_index),
    
    -- Indexes
    INDEX idx_product_items_product_id (product_id),
    INDEX idx_product_items_token_id (token_id),
    INDEX idx_product_items_seal_status (seal_status),
    INDEX idx_product_items_current_owner (current_owner_id),
    INDEX idx_product_items_claim_code_hash (claim_code_hash)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V8__create_product_items_table.sql =====

-- ===== BEGIN V9__create_orders_table.sql =====

-- V9: Create orders table — purchase tracking

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Order reference
    order_number VARCHAR(30) NOT NULL,
    
    -- Product & item references
    product_id BIGINT NOT NULL,
    product_item_id BIGINT,
    
    -- Buyer
    buyer_id BIGINT NOT NULL,
    buyer_wallet VARCHAR(42),
    
    -- Quantity
    quantity INT NOT NULL DEFAULT 1,
    
    -- Payment info
    unit_price DECIMAL(18,8) NOT NULL,
    total_price DECIMAL(18,8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'MATIC',
    payment_tx_hash VARCHAR(66),
    payment_confirmed_at TIMESTAMP NULL,
    
    -- Shipping
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    -- Seal transfer
    seal_transfer_tx_hash VARCHAR(66),
    completed_at TIMESTAMP NULL,
    
    -- Cancellation
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_orders_product_item FOREIGN KEY (product_item_id) REFERENCES product_items(id),
    CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
    
    -- Unique constraints
    CONSTRAINT uk_orders_order_number UNIQUE (order_number),
    
    -- Indexes
    INDEX idx_orders_product_id (product_id),
    INDEX idx_orders_buyer_id (buyer_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_order_number (order_number),
    INDEX idx_orders_created_at (created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V9__create_orders_table.sql =====

-- ===== BEGIN V10__create_ownership_history_table.sql =====

-- V10: Create ownership_history table — provenance tracking for digital seals

CREATE TABLE IF NOT EXISTS ownership_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Product item reference
    product_item_id BIGINT NOT NULL,
    
    -- Transfer details
    from_wallet VARCHAR(42),
    to_wallet VARCHAR(42),
    transfer_type VARCHAR(20) NOT NULL,
    
    -- Blockchain proof
    tx_hash VARCHAR(66),
    block_number BIGINT,
    
    -- Notes
    notes VARCHAR(500),
    
    -- When it happened
    transferred_at TIMESTAMP NOT NULL,
    
    -- Record timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_ownership_history_item FOREIGN KEY (product_item_id) REFERENCES product_items(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_ownership_history_item_id (product_item_id),
    INDEX idx_ownership_history_transfer_type (transfer_type),
    INDEX idx_ownership_history_tx_hash (tx_hash),
    INDEX idx_ownership_history_transferred_at (transferred_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== END V10__create_ownership_history_table.sql =====

-- ===== BEGIN V11__create_platform_logs_table.sql =====

-- Platform Activity Log
-- Stores every significant event on the platform for monitoring, auditing, and debugging.

CREATE TABLE platform_logs (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    -- Severity
    level           VARCHAR(10)     NOT NULL COMMENT 'INFO | WARN | ERROR',

    -- Logical group this event belongs to
    category        VARCHAR(20)     NOT NULL COMMENT 'AUTH | ORDER | CLAIM | BLOCKCHAIN | PRODUCT | BRAND | USER | WALLET | SYSTEM',

    -- Short machine-readable action name, e.g. USER_LOGIN, ORDER_CREATED, NFT_TRANSFER_FAILED
    action          VARCHAR(100)    NOT NULL,

    -- Who triggered this event (nullable for system/anonymous events)
    user_id         BIGINT          NULL,
    user_email      VARCHAR(100)    NULL,

    -- The entity this event is about, e.g. entityType=ORDER entityId=42
    entity_type     VARCHAR(50)     NULL,
    entity_id       VARCHAR(50)     NULL,

    -- Human-readable or JSON details
    details         TEXT            NULL,

    -- Populated only for ERROR level
    error_message   TEXT            NULL,

    -- HTTP request context
    ip_address      VARCHAR(45)     NULL,
    user_agent      VARCHAR(500)    NULL,
    http_method     VARCHAR(10)     NULL,
    request_path    VARCHAR(500)    NULL,

    -- How long the operation took (milliseconds)
    duration_ms     BIGINT          NULL,

    -- Did the operation complete successfully?
    success         TINYINT(1)      NOT NULL DEFAULT 1,

    PRIMARY KEY (id),

    -- Common query patterns
    INDEX idx_pl_created_at     (created_at),
    INDEX idx_pl_level          (level),
    INDEX idx_pl_category       (category),
    INDEX idx_pl_user_id        (user_id),
    INDEX idx_pl_action         (action),
    INDEX idx_pl_entity         (entity_type, entity_id),
    INDEX idx_pl_success        (success),

    CONSTRAINT fk_pl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Platform-wide activity and error log for monitoring';


-- ===== END V11__create_platform_logs_table.sql =====

-- ===== BEGIN V12__add_username_to_users.sql =====

-- Add username column to users table
ALTER TABLE users ADD COLUMN user_name VARCHAR(255) UNIQUE;


-- ===== END V12__add_username_to_users.sql =====

-- ===== BEGIN V13__add_ui_fields_to_collections.sql =====

ALTER TABLE collections
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' AFTER release_date,
    ADD COLUMN tag VARCHAR(50) NULL AFTER status,
    ADD COLUMN sales_end_at TIMESTAMP NULL AFTER tag,
    ADD COLUMN tag_color VARCHAR(20) NULL AFTER sales_end_at,
    ADD COLUMN tag_text_color VARCHAR(20) NULL AFTER tag_color;

CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_sales_end_at ON collections(sales_end_at);

-- ---------------------------------------------------------------------------
-- Dummy data for local development (users -> brands -> collections)
-- ---------------------------------------------------------------------------

INSERT INTO users (
    first_name,
    last_name,
    user_name,
    email,
    password_hash,
    wallet_address,
    wallet_nonce,
    phone_number,
    auth_type,
    role,
    is_active,
    email_verified,
    wallet_verified,
    is_locked,
    failed_login_attempts
) VALUES
(
    'Gerry',
    'Julian',
    'gerryjulian',
    'gerry.julian@zeal-demo.com',
    '$2a$10$3FKM2QQ2E2mvY/fakehashKxg5.0K8rEJ49m3gRcj6UpqQj1JY7Q8Aa',
    '0x1111111111111111111111111111111111111111',
    UUID(),
    '+6281234567890',
    'EMAIL',
    'BRAND',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    0
),
(
    'Aurelia',
    'Tan',
    'aureliatan',
    'aurelia.tan@zeal-demo.com',
    '$2a$10$3FKM2QQ2E2mvY/fakehashKxg5.0K8rEJ49m3gRcj6UpqQj1JY7Q8Aa',
    '0x2222222222222222222222222222222222222222',
    UUID(),
    '+6281298765432',
    'EMAIL',
    'BRAND',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    0
);

INSERT INTO brands (
    user_id,
    brand_name,
    company_email,
    company_address,
    company_wallet_address,
    logo,
    company_banner,
    statement_letter_url,
    person_in_charge_name,
    person_in_charge_role,
    person_in_charge_email,
    person_in_charge_phone,
    description,
    verified
) VALUES
(
    1,
    'Hermes',
    'contact@hermes-demo.com',
    '24 Rue du Faubourg Saint-Honore, Paris, France',
    '0x3333333333333333333333333333333333333333',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hermes_paris_logo.svg/200px-Hermes_paris_logo.svg.png',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=80',
    'https://example.com/docs/hermes-statement-letter.pdf',
    'Gerry Julian',
    'Chief Operating Officer',
    'gerry.julian@hermes-demo.com',
    '+6281234567890',
    'French luxury house with premium handcrafted items.',
    TRUE
),
(
    2,
    'Nintendo',
    'contact@nintendo-demo.com',
    '11-1 Kamitoba Hokodate-cho, Minami-ku, Kyoto, Japan',
    '0x4444444444444444444444444444444444444444',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png',
    'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=1400&q=80',
    'https://example.com/docs/nintendo-statement-letter.pdf',
    'Aurelia Tan',
    'Brand Partnership Lead',
    'aurelia.tan@nintendo-demo.com',
    '+6281298765432',
    'Collectible gaming products and limited card sets.',
    TRUE
);

INSERT INTO collections (
    brand_id,
    collection_name,
    description,
    image_url,
    season,
    is_limited_edition,
    release_date,
    status,
    tag,
    sales_end_at,
    tag_color,
    tag_text_color
) VALUES
(
    1,
    'Birkin Collections',
    'Luxury bags with handcrafted details.',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60',
    'Luxury Bags',
    TRUE,
    '2026-01-15',
    'DRAFT',
    'Rare',
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    '#111',
    '#fff'
),
(
    1,
    'Submariner Series',
    'Luxury watches and timepieces.',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=60',
    'Luxury Watches',
    TRUE,
    '2026-02-01',
    'DRAFT',
    'Limited',
    DATE_ADD(NOW(), INTERVAL 9 DAY),
    '#ffb300',
    '#111'
),
(
    2,
    'Pokemon Card',
    'High-end collectible cards.',
    'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60',
    'Collectible Cards',
    TRUE,
    '2026-02-21',
    'LISTED',
    'Limited',
    DATE_ADD(NOW(), INTERVAL 12 HOUR),
    '#ffb300',
    '#111'
),
(
    1,
    'Vintage Apparel',
    'Streetwear and premium vintage fashion.',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=60',
    'Streetwear Collection',
    FALSE,
    '2026-03-03',
    'LISTED',
    'Rare',
    NULL,
    '#111',
    '#fff'
),
(
    1,
    'Speedy Bag Series',
    'Designer handbag series.',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=60',
    'Designer Handbags',
    TRUE,
    '2025-11-19',
    'EXPIRED',
    'Rare',
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    '#111',
    '#fff'
),
(
    1,
    'Marmont Collection',
    'Premium fashion accessories.',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=60',
    'Fashion Accessories',
    FALSE,
    '2025-10-12',
    'EXPIRED',
    'Common',
    DATE_SUB(NOW(), INTERVAL 15 DAY),
    '#333',
    '#fff'
);


-- ===== END V13__add_ui_fields_to_collections.sql =====

-- ===== BEGIN V14__refactor_products_to_code_and_dynamic_quantity.sql =====

-- V14: Refactor products to use public 6-char product code and dynamic quantities

DROP PROCEDURE IF EXISTS migrate_v14;
DELIMITER //
CREATE PROCEDURE migrate_v14()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id BIGINT;
    DECLARE v_code VARCHAR(6);

    DECLARE cur CURSOR FOR
        SELECT id FROM products WHERE product_code IS NULL OR product_code = '';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Add public product code column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'product_code'
    ) THEN
        ALTER TABLE products ADD COLUMN product_code VARCHAR(6) NULL AFTER id;
    END IF;

    -- Backfill existing rows with deterministic base36 code (unique, uppercase, 6 chars)
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET v_code = UPPER(LPAD(CONV(v_id, 10, 36), 6, '0'));
        UPDATE products SET product_code = v_code WHERE id = v_id;
    END LOOP;
    CLOSE cur;

    -- Enforce non-null + unique product code
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'product_code' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE products MODIFY COLUMN product_code VARCHAR(6) NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'uk_products_product_code'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT uk_products_product_code UNIQUE (product_code);
    END IF;

    -- Drop sku constraints/indexes if present
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE() AND table_name = 'products' AND constraint_name = 'uk_products_sku'
    ) THEN
        ALTER TABLE products DROP INDEX uk_products_sku;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE() AND table_name = 'products' AND constraint_name = 'uk_products_serial_number'
    ) THEN
        ALTER TABLE products DROP INDEX uk_products_serial_number;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_sku'
    ) THEN
        ALTER TABLE products DROP INDEX idx_products_sku;
    END IF;

    -- Drop deprecated product columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'sku'
    ) THEN
        ALTER TABLE products DROP COLUMN sku;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'serial_number'
    ) THEN
        ALTER TABLE products DROP COLUMN serial_number;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'currency'
    ) THEN
        ALTER TABLE products DROP COLUMN currency;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'total_quantity'
    ) THEN
        ALTER TABLE products DROP COLUMN total_quantity;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'available_quantity'
    ) THEN
        ALTER TABLE products DROP COLUMN available_quantity;
    END IF;
END //
DELIMITER ;

CALL migrate_v14();
DROP PROCEDURE IF EXISTS migrate_v14;


-- ===== END V14__refactor_products_to_code_and_dynamic_quantity.sql =====

-- ===== BEGIN V15__remove_currency_from_orders.sql =====

-- V15: Remove currency from orders (price remains token-denominated)

SET @drop_orders_currency = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'orders'
              AND column_name = 'currency'
        ),
        'ALTER TABLE orders DROP COLUMN currency',
        'SELECT 1'
    )
);

PREPARE stmt FROM @drop_orders_currency;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ===== END V15__remove_currency_from_orders.sql =====

-- ===== BEGIN V16__seed_dummy_marketplace_products_offchain.sql =====

-- V16: Seed offchain dummy marketplace products and inventory for frontend integration

DROP PROCEDURE IF EXISTS migrate_v16;
DELIMITER //
CREATE PROCEDURE migrate_v16()
BEGIN
    -- -----------------------------------------------------------------------
    -- Seed listed products (idempotent by product_code)
    -- -----------------------------------------------------------------------

    INSERT INTO products (
        product_code,
        brand_id,
        collection_id,
        product_name,
        description,
        category,
        image_url,
        price,
        status,
        listed_at,
        listing_deadline,
        preminted_at,
        created_at,
        updated_at
    )
    SELECT
        'BIRK01',
        c.brand_id,
        c.id,
        'Birkin Brownies',
        'Offchain demo product for marketplace and checkout flow.',
        'HANDBAG',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60',
        120100.00000000,
        'LISTED',
        NOW(),
        DATE_ADD(NOW(), INTERVAL 14 DAY),
        NOW(),
        NOW(),
        NOW()
    FROM collections c
    WHERE c.collection_name = 'Birkin Collections'
      AND NOT EXISTS (SELECT 1 FROM products p WHERE p.product_code = 'BIRK01')
    LIMIT 1;

    INSERT INTO products (
        product_code,
        brand_id,
        collection_id,
        product_name,
        description,
        category,
        image_url,
        price,
        status,
        listed_at,
        listing_deadline,
        preminted_at,
        created_at,
        updated_at
    )
    SELECT
        'BIRK02',
        c.brand_id,
        c.id,
        'Birkin Bluestorn',
        'Offchain demo product variant for marketplace and product detail flow.',
        'HANDBAG',
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=60',
        98500.00000000,
        'LISTED',
        NOW(),
        DATE_ADD(NOW(), INTERVAL 10 DAY),
        NOW(),
        NOW(),
        NOW()
    FROM collections c
    WHERE c.collection_name = 'Birkin Collections'
      AND NOT EXISTS (SELECT 1 FROM products p WHERE p.product_code = 'BIRK02')
    LIMIT 1;

    INSERT INTO products (
        product_code,
        brand_id,
        collection_id,
        product_name,
        description,
        category,
        image_url,
        price,
        status,
        listed_at,
        listing_deadline,
        preminted_at,
        created_at,
        updated_at
    )
    SELECT
        'POKE01',
        c.brand_id,
        c.id,
        'Pokemon Card Set',
        'Offchain demo collectible product for marketplace browsing.',
        'COLLECTIBLE',
        'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=60',
        52100.00000000,
        'LISTED',
        NOW(),
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        NOW(),
        NOW(),
        NOW()
    FROM collections c
    WHERE c.collection_name = 'Pokemon Card'
      AND NOT EXISTS (SELECT 1 FROM products p WHERE p.product_code = 'POKE01')
    LIMIT 1;

    -- -----------------------------------------------------------------------
    -- Seed product items as offchain inventory (PRE_MINTED)
    -- -----------------------------------------------------------------------

    IF EXISTS (SELECT 1 FROM products WHERE product_code = 'BIRK01')
       AND NOT EXISTS (
           SELECT 1
           FROM product_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE p.product_code = 'BIRK01'
       ) THEN
        INSERT INTO product_items (
            product_id,
            item_serial,
            item_index,
            claim_code,
            seal_status,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            CONCAT(p.product_code, '-', LPAD(seq.n, 4, '0')),
            seq.n,
            CONCAT('CLM-', p.product_code, '-', LPAD(seq.n, 4, '0')),
            'PRE_MINTED',
            NOW(),
            NOW()
        FROM products p
        JOIN (
            SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
            SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL
            SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL
            SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL
            SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
        ) seq
        WHERE p.product_code = 'BIRK01';
    END IF;

    IF EXISTS (SELECT 1 FROM products WHERE product_code = 'BIRK02')
       AND NOT EXISTS (
           SELECT 1
           FROM product_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE p.product_code = 'BIRK02'
       ) THEN
        INSERT INTO product_items (
            product_id,
            item_serial,
            item_index,
            claim_code,
            seal_status,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            CONCAT(p.product_code, '-', LPAD(seq.n, 4, '0')),
            seq.n,
            CONCAT('CLM-', p.product_code, '-', LPAD(seq.n, 4, '0')),
            'PRE_MINTED',
            NOW(),
            NOW()
        FROM products p
        JOIN (
            SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
            SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL
            SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
        ) seq
        WHERE p.product_code = 'BIRK02';
    END IF;

    IF EXISTS (SELECT 1 FROM products WHERE product_code = 'POKE01')
       AND NOT EXISTS (
           SELECT 1
           FROM product_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE p.product_code = 'POKE01'
       ) THEN
        INSERT INTO product_items (
            product_id,
            item_serial,
            item_index,
            claim_code,
            seal_status,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            CONCAT(p.product_code, '-', LPAD(seq.n, 4, '0')),
            seq.n,
            CONCAT('CLM-', p.product_code, '-', LPAD(seq.n, 4, '0')),
            'PRE_MINTED',
            NOW(),
            NOW()
        FROM products p
        JOIN (
            SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
            SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
        ) seq
        WHERE p.product_code = 'POKE01';
    END IF;
END //
DELIMITER ;

CALL migrate_v16();
DROP PROCEDURE IF EXISTS migrate_v16;


-- ===== END V16__seed_dummy_marketplace_products_offchain.sql =====

-- ===== BEGIN V17__add_three_qr_codes_to_product_items.sql =====

-- V17: Add three QR payload columns (NFT, product label, certificate) to product_items

ALTER TABLE product_items
    ADD COLUMN nft_qr_code VARCHAR(255) NULL AFTER claim_code_hash,
    ADD COLUMN product_label_qr_code VARCHAR(255) NULL AFTER nft_qr_code,
    ADD COLUMN certificate_qr_code VARCHAR(255) NULL AFTER product_label_qr_code;

-- Backfill existing rows safely so current inventory gets usable QR payloads.
UPDATE product_items
SET
    nft_qr_code = COALESCE(NULLIF(nft_qr_code, ''), CONCAT('digitalseal://nft/', item_serial)),
    product_label_qr_code = COALESCE(
        NULLIF(product_label_qr_code, ''),
        COALESCE(NULLIF(claim_code, ''), CONCAT('digitalseal://label/', item_serial))
    ),
    certificate_qr_code = COALESCE(NULLIF(certificate_qr_code, ''), CONCAT('digitalseal://certificate/', item_serial));


-- ===== END V17__add_three_qr_codes_to_product_items.sql =====

-- ===== BEGIN V18__seed_dummy_orders.sql =====

-- V18: Seed dummy orders for creator order flow (idempotent)

DROP PROCEDURE IF EXISTS migrate_v18;
DELIMITER //
CREATE PROCEDURE migrate_v18()
BEGIN
    DECLARE v_buyer_id BIGINT DEFAULT NULL;
    DECLARE v_birk01_id BIGINT DEFAULT NULL;
    DECLARE v_birk02_id BIGINT DEFAULT NULL;
    DECLARE v_poke01_id BIGINT DEFAULT NULL;

    DECLARE v_birk01_price DECIMAL(18,8) DEFAULT NULL;
    DECLARE v_birk02_price DECIMAL(18,8) DEFAULT NULL;
    DECLARE v_poke01_price DECIMAL(18,8) DEFAULT NULL;

    DECLARE v_birk01_item1 BIGINT DEFAULT NULL;
    DECLARE v_birk01_item2 BIGINT DEFAULT NULL;
    DECLARE v_birk01_item3 BIGINT DEFAULT NULL;
    DECLARE v_birk01_item4 BIGINT DEFAULT NULL;
    DECLARE v_birk02_item1 BIGINT DEFAULT NULL;
    DECLARE v_poke01_item1 BIGINT DEFAULT NULL;

    DECLARE v_buyer_wallet VARCHAR(42) DEFAULT '0x5555555555555555555555555555555555555555';

    -- -------------------------------------------------------------------
    -- Ensure one demo buyer exists
    -- -------------------------------------------------------------------
    INSERT INTO users (
        first_name,
        last_name,
        user_name,
        email,
        password_hash,
        wallet_address,
        wallet_nonce,
        phone_number,
        auth_type,
        role,
        is_active,
        email_verified,
        wallet_verified,
        is_locked,
        failed_login_attempts
    )
    SELECT
        'Demo',
        'Collector',
        'collector_demo',
        'collector.demo@zeal-demo.com',
        '$2a$10$3FKM2QQ2E2mvY/fakehashKxg5.0K8rEJ49m3gRcj6UpqQj1JY7Q8Aa',
        v_buyer_wallet,
        UUID(),
        '+6591234567',
        'EMAIL',
        'OWNER',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        0
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE user_name = 'collector_demo'
    );

    SELECT id INTO v_buyer_id
    FROM users
    WHERE user_name = 'collector_demo'
    LIMIT 1;

    -- -------------------------------------------------------------------
    -- Resolve demo products and item slots
    -- -------------------------------------------------------------------
    SELECT id, price INTO v_birk01_id, v_birk01_price
    FROM products
    WHERE product_code = 'BIRK01'
    LIMIT 1;

    SELECT id, price INTO v_birk02_id, v_birk02_price
    FROM products
    WHERE product_code = 'BIRK02'
    LIMIT 1;

    SELECT id, price INTO v_poke01_id, v_poke01_price
    FROM products
    WHERE product_code = 'POKE01'
    LIMIT 1;

    IF v_birk01_id IS NOT NULL THEN
        SELECT id INTO v_birk01_item1 FROM product_items WHERE product_id = v_birk01_id AND item_index = 1 LIMIT 1;
        SELECT id INTO v_birk01_item2 FROM product_items WHERE product_id = v_birk01_id AND item_index = 2 LIMIT 1;
        SELECT id INTO v_birk01_item3 FROM product_items WHERE product_id = v_birk01_id AND item_index = 3 LIMIT 1;
        SELECT id INTO v_birk01_item4 FROM product_items WHERE product_id = v_birk01_id AND item_index = 4 LIMIT 1;
    END IF;

    IF v_birk02_id IS NOT NULL THEN
        SELECT id INTO v_birk02_item1 FROM product_items WHERE product_id = v_birk02_id AND item_index = 1 LIMIT 1;
    END IF;

    IF v_poke01_id IS NOT NULL THEN
        SELECT id INTO v_poke01_item1 FROM product_items WHERE product_id = v_poke01_id AND item_index = 1 LIMIT 1;
    END IF;

    -- -------------------------------------------------------------------
    -- Seed realistic order lifecycle records
    -- -------------------------------------------------------------------

    -- Request / Pending
    INSERT INTO orders (
        order_number,
        product_id,
        product_item_id,
        buyer_id,
        buyer_wallet,
        quantity,
        unit_price,
        total_price,
        shipping_address,
        status,
        created_at,
        updated_at
    )
    SELECT
        'ORD-DEMO-BIRK01-PEN',
        v_birk01_id,
        v_birk01_item1,
        v_buyer_id,
        v_buyer_wallet,
        1,
        v_birk01_price,
        v_birk01_price,
        '221B Baker Street, London NW1, United Kingdom',
        'PENDING',
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    WHERE v_buyer_id IS NOT NULL
      AND v_birk01_id IS NOT NULL
      AND v_birk01_price IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-DEMO-BIRK01-PEN');

    -- On Prepare / Processing
    INSERT INTO orders (
        order_number,
        product_id,
        product_item_id,
        buyer_id,
        buyer_wallet,
        quantity,
        unit_price,
        total_price,
        payment_tx_hash,
        payment_confirmed_at,
        shipping_address,
        status,
        created_at,
        updated_at
    )
    SELECT
        'ORD-DEMO-BIRK01-PRO',
        v_birk01_id,
        v_birk01_item2,
        v_buyer_id,
        v_buyer_wallet,
        1,
        v_birk01_price,
        v_birk01_price,
        '0xpaydemo000000000000000000000000000000000000000000000000000000001',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        '350 Fifth Avenue, New York, NY 10118, United States',
        'PROCESSING',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    WHERE v_buyer_id IS NOT NULL
      AND v_birk01_id IS NOT NULL
      AND v_birk01_price IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-DEMO-BIRK01-PRO');

    -- On Shipment / Shipped
    INSERT INTO orders (
        order_number,
        product_id,
        product_item_id,
        buyer_id,
        buyer_wallet,
        quantity,
        unit_price,
        total_price,
        payment_tx_hash,
        payment_confirmed_at,
        shipping_address,
        tracking_number,
        shipped_at,
        status,
        created_at,
        updated_at
    )
    SELECT
        'ORD-DEMO-BIRK01-SHP',
        v_birk01_id,
        v_birk01_item3,
        v_buyer_id,
        v_buyer_wallet,
        1,
        v_birk01_price,
        v_birk01_price,
        '0xpaydemo000000000000000000000000000000000000000000000000000000002',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        '1 Raffles Place, Singapore 048616',
        'TRK-DEMO-1001',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        'SHIPPED',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    WHERE v_buyer_id IS NOT NULL
      AND v_birk01_id IS NOT NULL
      AND v_birk01_price IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-DEMO-BIRK01-SHP');

    -- Claimed / Completed
    INSERT INTO orders (
        order_number,
        product_id,
        product_item_id,
        buyer_id,
        buyer_wallet,
        quantity,
        unit_price,
        total_price,
        payment_tx_hash,
        payment_confirmed_at,
        shipping_address,
        tracking_number,
        shipped_at,
        delivered_at,
        seal_transfer_tx_hash,
        completed_at,
        status,
        created_at,
        updated_at
    )
    SELECT
        'ORD-DEMO-BIRK01-CMP',
        v_birk01_id,
        v_birk01_item4,
        v_buyer_id,
        v_buyer_wallet,
        1,
        v_birk01_price,
        v_birk01_price,
        '0xpaydemo000000000000000000000000000000000000000000000000000000003',
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        'The Bund, Zhongshan East 1st Rd, Shanghai, China',
        'TRK-DEMO-1002',
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        '0xsealdemo0000000000000000000000000000000000000000000000000000001',
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        'COMPLETED',
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    WHERE v_buyer_id IS NOT NULL
      AND v_birk01_id IS NOT NULL
      AND v_birk01_price IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-DEMO-BIRK01-CMP');

    -- Cancelled example
    INSERT INTO orders (
        order_number,
        product_id,
        product_item_id,
        buyer_id,
        buyer_wallet,
        quantity,
        unit_price,
        total_price,
        shipping_address,
        status,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at
    )
    SELECT
        'ORD-DEMO-BIRK02-CNL',
        v_birk02_id,
        v_birk02_item1,
        v_buyer_id,
        v_buyer_wallet,
        1,
        v_birk02_price,
        v_birk02_price,
        'Shibuya Crossing, Tokyo, Japan',
        'CANCELLED',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        'Buyer changed shipping destination before payment.',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    WHERE v_buyer_id IS NOT NULL
      AND v_birk02_id IS NOT NULL
      AND v_birk02_price IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-DEMO-BIRK02-CNL');

    -- Payment received example
    INSERT INTO orders (
        order_number,
        product_id,
        product_item_id,
        buyer_id,
        buyer_wallet,
        quantity,
        unit_price,
        total_price,
        payment_tx_hash,
        payment_confirmed_at,
        shipping_address,
        status,
        created_at,
        updated_at
    )
    SELECT
        'ORD-DEMO-POKE01-PAY',
        v_poke01_id,
        v_poke01_item1,
        v_buyer_id,
        v_buyer_wallet,
        1,
        v_poke01_price,
        v_poke01_price,
        '0xpaydemo000000000000000000000000000000000000000000000000000000004',
        DATE_SUB(NOW(), INTERVAL 10 HOUR),
        'Alexanderplatz, Berlin, Germany',
        'PAYMENT_RECEIVED',
        DATE_SUB(NOW(), INTERVAL 12 HOUR),
        DATE_SUB(NOW(), INTERVAL 10 HOUR)
    WHERE v_buyer_id IS NOT NULL
      AND v_poke01_id IS NOT NULL
      AND v_poke01_price IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-DEMO-POKE01-PAY');

    -- -------------------------------------------------------------------
    -- Reflect item ownership/status snapshots for seeded records
    -- -------------------------------------------------------------------
    IF v_birk01_item1 IS NOT NULL THEN
        UPDATE product_items
        SET seal_status = 'RESERVED'
        WHERE id = v_birk01_item1 AND seal_status IN ('PRE_MINTED', 'RESERVED');
    END IF;

    IF v_birk01_item2 IS NOT NULL THEN
        UPDATE product_items
        SET seal_status = 'RESERVED'
        WHERE id = v_birk01_item2 AND seal_status IN ('PRE_MINTED', 'RESERVED');
    END IF;

    IF v_birk01_item3 IS NOT NULL THEN
        UPDATE product_items
        SET seal_status = 'RESERVED'
        WHERE id = v_birk01_item3 AND seal_status IN ('PRE_MINTED', 'RESERVED');
    END IF;

    IF v_birk01_item4 IS NOT NULL THEN
        UPDATE product_items
        SET
            seal_status = 'REALIZED',
            current_owner_id = v_buyer_id,
            current_owner_wallet = v_buyer_wallet,
            sold_at = COALESCE(sold_at, DATE_SUB(NOW(), INTERVAL 6 DAY))
        WHERE id = v_birk01_item4;
    END IF;

    IF v_birk02_item1 IS NOT NULL THEN
        UPDATE product_items
        SET seal_status = 'PRE_MINTED'
        WHERE id = v_birk02_item1;
    END IF;

    IF v_poke01_item1 IS NOT NULL THEN
        UPDATE product_items
        SET seal_status = 'RESERVED'
        WHERE id = v_poke01_item1 AND seal_status IN ('PRE_MINTED', 'RESERVED');
    END IF;
END //
DELIMITER ;

CALL migrate_v18();
DROP PROCEDURE IF EXISTS migrate_v18;


-- ===== END V18__seed_dummy_orders.sql =====

-- ===== BEGIN V19__drop_blockchain_columns.sql =====

-- V19: Remove obsolete blockchain-specific columns for creator-only off-chain flow

DROP PROCEDURE IF EXISTS migrate_v19;
DELIMITER //
CREATE PROCEDURE migrate_v19()
BEGIN
    -- products
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'contract_address'
    ) THEN
        ALTER TABLE products DROP COLUMN contract_address;
    END IF;

    -- product_items
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'product_items' AND column_name = 'token_id'
    ) THEN
        ALTER TABLE product_items DROP COLUMN token_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'product_items' AND column_name = 'mint_tx_hash'
    ) THEN
        ALTER TABLE product_items DROP COLUMN mint_tx_hash;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'product_items' AND column_name = 'transfer_tx_hash'
    ) THEN
        ALTER TABLE product_items DROP COLUMN transfer_tx_hash;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'product_items' AND index_name = 'idx_product_items_token_id'
    ) THEN
        ALTER TABLE product_items DROP INDEX idx_product_items_token_id;
    END IF;

    -- orders
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'seal_transfer_tx_hash'
    ) THEN
        ALTER TABLE orders DROP COLUMN seal_transfer_tx_hash;
    END IF;

    -- ownership_history
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'ownership_history' AND column_name = 'tx_hash'
    ) THEN
        ALTER TABLE ownership_history DROP COLUMN tx_hash;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'ownership_history' AND column_name = 'block_number'
    ) THEN
        ALTER TABLE ownership_history DROP COLUMN block_number;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'ownership_history' AND index_name = 'idx_ownership_history_tx_hash'
    ) THEN
        ALTER TABLE ownership_history DROP INDEX idx_ownership_history_tx_hash;
    END IF;
END //
DELIMITER ;

CALL migrate_v19();
DROP PROCEDURE IF EXISTS migrate_v19;


-- ===== END V19__drop_blockchain_columns.sql =====

-- ===== BEGIN V20__normalize_demo_seed_emails.sql =====

-- V20: Normalize legacy demo seed emails to TrustMark domain

UPDATE users
SET email = CONCAT(SUBSTRING_INDEX(email, '@', 1), '@trustmark-demo.com')
WHERE email LIKE '%-demo.com';


-- ===== END V20__normalize_demo_seed_emails.sql =====

-- ===== BEGIN V21__normalize_qr_scheme_to_trustmark.sql =====

-- V21: Normalize legacy QR payload scheme from digitalseal:// to trustmark://

UPDATE product_items
SET nft_qr_code = REPLACE(nft_qr_code, 'digitalseal://', 'trustmark://')
WHERE nft_qr_code LIKE 'digitalseal://%';

UPDATE product_items
SET product_label_qr_code = REPLACE(product_label_qr_code, 'digitalseal://', 'trustmark://')
WHERE product_label_qr_code LIKE 'digitalseal://%';

UPDATE product_items
SET certificate_qr_code = REPLACE(certificate_qr_code, 'digitalseal://', 'trustmark://')
WHERE certificate_qr_code LIKE 'digitalseal://%';


-- ===== END V21__normalize_qr_scheme_to_trustmark.sql =====

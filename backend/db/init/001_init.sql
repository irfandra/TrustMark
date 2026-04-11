-- TrustMark initial schema + seed (single init SQL)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE brands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255),
    company_address TEXT,
    logo VARCHAR(500),
    company_banner VARCHAR(500),
    person_in_charge_name VARCHAR(255),
    person_in_charge_role VARCHAR(255),
    person_in_charge_email VARCHAR(255),
    person_in_charge_phone VARCHAR(30),
    description TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_brands_name (brand_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    brand_id BIGINT NOT NULL,
    collection_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    category VARCHAR(100),
    release_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    tag VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_collections_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    INDEX idx_collections_brand_id (brand_id),
    INDEX idx_collections_status (status),
    UNIQUE KEY uk_collections_brand_name (brand_id, collection_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(6) NOT NULL,
    brand_id BIGINT NOT NULL,
    collection_id BIGINT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(500),
    price DECIMAL(18, 8),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    listed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
    UNIQUE KEY uk_products_code (product_code),
    INDEX idx_products_brand_id (brand_id),
    INDEX idx_products_collection_id (collection_id),
    INDEX idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    item_serial VARCHAR(150) NOT NULL,
    item_index INT NOT NULL,
    certificate_qr_code VARCHAR(255) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    shipped_at TIMESTAMP NULL,
    claimed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_items_serial (item_serial),
    UNIQUE KEY uk_product_items_qr (certificate_qr_code),
    UNIQUE KEY uk_product_items_product_index (product_id, item_index),
    INDEX idx_product_items_product_id (product_id),
    INDEX idx_product_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL,
    product_id BIGINT NOT NULL,
    product_item_id BIGINT NULL,
    recipient_name VARCHAR(255),
    recipient_phone_number VARCHAR(30),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(18, 8) NOT NULL,
    total_price DECIMAL(18, 8) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP NULL,
    estimated_at TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_shipments_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_shipments_product_item FOREIGN KEY (product_item_id) REFERENCES product_items(id) ON DELETE SET NULL,
    UNIQUE KEY uk_shipments_number (order_number),
    INDEX idx_shipments_product_id (product_id),
    INDEX idx_shipments_product_item_id (product_item_id),
    INDEX idx_shipments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO brands (
    brand_name,
    company_email,
    company_address,
    logo,
    company_banner,
    person_in_charge_name,
    person_in_charge_role,
    person_in_charge_email,
    person_in_charge_phone,
    description,
    verified
) VALUES
(
    'TRUSTMARK',
    'hello@trustmark.app',
    'Jakarta, Indonesia',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
    'Irfan Rahmanindra',
    'Founder',
    'irfan@trustmark.app',
    '+62 812 0000 0000',
    'Digital authentication and ownership platform.',
    TRUE
);

INSERT INTO collections (
    brand_id,
    collection_name,
    description,
    image_url,
    category,
    release_date,
    status,
    tag
)
SELECT
    b.id,
    'Heritage Collection',
    'Signature flagship collectibles.',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    '2026',
    '2026-01-01',
    'ACTIVE',
    'In Stock'
FROM brands b
WHERE b.brand_name = 'TRUSTMARK';

INSERT INTO products (
    product_code,
    brand_id,
    collection_id,
    product_name,
    description,
    category,
    image_url,
    price,
    currency,
    status,
    listed_at
)
SELECT
    'BIRK01',
    b.id,
    c.id,
    'Birkin Heritage 30',
    'Collector edition product item.',
    'HANDBAG',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
    12500.00,
    'USD',
    'ACTIVE',
    NOW()
FROM brands b
JOIN collections c ON c.brand_id = b.id
WHERE b.brand_name = 'TRUSTMARK'
  AND c.collection_name = 'Heritage Collection';

INSERT INTO products (
    product_code,
    brand_id,
    collection_id,
    product_name,
    description,
    category,
    image_url,
    price,
    currency,
    status,
    listed_at
)
SELECT
    'BIRK02',
    b.id,
    c.id,
    'Birkin Heritage 35',
    'Second collector edition product item.',
    'HANDBAG',
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1000&q=80',
    13250.00,
    'USD',
    'ACTIVE',
    NOW()
FROM brands b
JOIN collections c ON c.brand_id = b.id
WHERE b.brand_name = 'TRUSTMARK'
  AND c.collection_name = 'Heritage Collection';

INSERT INTO product_items (
    product_id,
    item_serial,
    item_index,
    certificate_qr_code,
    status,
    created_at,
    updated_at
)
SELECT
    p.id,
    CONCAT(p.product_code, '-', LPAD(seq.n, 4, '0')),
    seq.n,
    CONCAT('trustmark://certificate/', CONCAT(p.product_code, '-', LPAD(seq.n, 4, '0'))),
    TRUE,
    NOW(),
    NOW()
FROM products p
JOIN (
    SELECT 1 AS n
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
) seq
WHERE p.product_code IN ('BIRK01', 'BIRK02');

INSERT INTO shipments (
    order_number,
    product_id,
    product_item_id,
    recipient_name,
    recipient_phone_number,
    quantity,
    unit_price,
    total_price,
    currency,
    shipping_address,
    tracking_number,
    shipped_at,
    estimated_at,
    status,
    completed_at,
    created_at,
    updated_at
)
SELECT
    'ORD-DEMO-BIRK01-001',
    p.id,
    pi.id,
    'Demo Collector',
    '+62 811 1111 1111',
    1,
    p.price,
    p.price,
    'USD',
    'Jakarta, Indonesia',
    'TRUSTMARK-DEMO-001',
    NOW(),
    NULL,
    'SHIPPED',
    NULL,
    NOW(),
    NOW()
FROM products p
JOIN product_items pi ON pi.product_id = p.id AND pi.item_index = 1
WHERE p.product_code = 'BIRK01';

UPDATE product_items pi
JOIN shipments s ON s.product_item_id = pi.id
SET pi.status = FALSE,
    pi.shipped_at = COALESCE(pi.shipped_at, s.shipped_at)
WHERE s.order_number = 'ORD-DEMO-BIRK01-001';

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

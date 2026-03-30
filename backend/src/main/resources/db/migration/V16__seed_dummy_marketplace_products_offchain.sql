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

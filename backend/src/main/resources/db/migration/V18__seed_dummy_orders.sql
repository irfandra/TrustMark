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

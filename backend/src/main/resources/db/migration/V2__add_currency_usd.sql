-- Add USD currency columns for pricing

DELIMITER //

CREATE PROCEDURE migrate_v2()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'products'
          AND column_name = 'currency'
    ) THEN
        ALTER TABLE products
            ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER price;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'orders'
          AND column_name = 'currency'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER total_price;
    END IF;

    UPDATE products SET currency = 'USD' WHERE currency IS NULL OR currency = '';
    UPDATE orders SET currency = 'USD' WHERE currency IS NULL OR currency = '';
END //

DELIMITER ;

CALL migrate_v2();
DROP PROCEDURE IF EXISTS migrate_v2;

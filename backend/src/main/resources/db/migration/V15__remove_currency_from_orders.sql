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

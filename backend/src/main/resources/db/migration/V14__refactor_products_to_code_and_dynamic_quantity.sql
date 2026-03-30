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

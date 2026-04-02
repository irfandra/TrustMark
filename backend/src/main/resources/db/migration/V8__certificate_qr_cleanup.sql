-- Keep certificate QR as the single canonical QR payload on product_items.

DROP PROCEDURE IF EXISTS migrate_v8;
DELIMITER //
CREATE PROCEDURE migrate_v8()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product_items'
      AND column_name = 'certificate_qr_code'
  ) THEN
    ALTER TABLE product_items
      ADD COLUMN certificate_qr_code VARCHAR(255) NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product_items'
      AND column_name = 'nft_qr_code'
  ) THEN
    ALTER TABLE product_items
      DROP COLUMN nft_qr_code;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product_items'
      AND column_name = 'product_label_qr_code'
  ) THEN
    ALTER TABLE product_items
      DROP COLUMN product_label_qr_code;
  END IF;

  UPDATE product_items
  SET certificate_qr_code = CONCAT('trustmark://certificate/', item_serial)
  WHERE certificate_qr_code IS NULL
     OR TRIM(certificate_qr_code) = ''
     OR certificate_qr_code <> CONCAT('trustmark://certificate/', item_serial);

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product_items'
      AND column_name = 'certificate_qr_code'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE product_items
      MODIFY certificate_qr_code VARCHAR(255) NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'product_items'
      AND index_name = 'uk_product_items_certificate_qr_code'
  ) THEN
    ALTER TABLE product_items
      ADD CONSTRAINT uk_product_items_certificate_qr_code UNIQUE (certificate_qr_code);
  END IF;
END //
DELIMITER ;

CALL migrate_v8();
DROP PROCEDURE IF EXISTS migrate_v8;

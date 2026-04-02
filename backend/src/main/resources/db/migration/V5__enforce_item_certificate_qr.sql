-- Enforce immutable authentication QR payload per product item.
-- Certificate QR is canonical: trustmark://certificate/{item_serial}

UPDATE product_items
SET certificate_qr_code = CONCAT('trustmark://certificate/', item_serial)
WHERE certificate_qr_code IS NULL
   OR TRIM(certificate_qr_code) = ''
   OR certificate_qr_code <> CONCAT('trustmark://certificate/', item_serial);

DROP PROCEDURE IF EXISTS migrate_v5;
DELIMITER //
CREATE PROCEDURE migrate_v5()
BEGIN
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

CALL migrate_v5();
DROP PROCEDURE IF EXISTS migrate_v5;

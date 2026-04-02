-- Normalize collection lifecycle statuses and remove sales_end_at.
UPDATE collections
SET status = 'ACTIVE'
WHERE status = 'LISTED';

UPDATE collections
SET status = 'INACTIVE'
WHERE status = 'EXPIRED';

DROP PROCEDURE IF EXISTS migrate_v4;
DELIMITER //
CREATE PROCEDURE migrate_v4()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'collections'
      AND index_name = 'idx_collections_sales_end_at'
  ) THEN
    ALTER TABLE collections DROP INDEX idx_collections_sales_end_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'collections'
      AND column_name = 'sales_end_at'
  ) THEN
    ALTER TABLE collections DROP COLUMN sales_end_at;
  END IF;
END //
DELIMITER ;

CALL migrate_v4();
DROP PROCEDURE IF EXISTS migrate_v4;

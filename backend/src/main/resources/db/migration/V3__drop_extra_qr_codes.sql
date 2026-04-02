-- Drop unused QR code columns, keep certificate only
ALTER TABLE product_items
  DROP COLUMN nft_qr_code,
  DROP COLUMN product_label_qr_code;

UPDATE product_items
SET certificate_qr_code = COALESCE(NULLIF(certificate_qr_code, ''), CONCAT('trustmark://certificate/', item_serial))
WHERE certificate_qr_code IS NULL OR certificate_qr_code = '';

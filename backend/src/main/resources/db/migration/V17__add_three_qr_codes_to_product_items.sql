-- V17: Add three QR payload columns (NFT, product label, certificate) to product_items

ALTER TABLE product_items
    ADD COLUMN nft_qr_code VARCHAR(255) NULL AFTER claim_code_hash,
    ADD COLUMN product_label_qr_code VARCHAR(255) NULL AFTER nft_qr_code,
    ADD COLUMN certificate_qr_code VARCHAR(255) NULL AFTER product_label_qr_code;

-- Backfill existing rows safely so current inventory gets usable QR payloads.
UPDATE product_items
SET
    nft_qr_code = COALESCE(NULLIF(nft_qr_code, ''), CONCAT('digitalseal://nft/', item_serial)),
    product_label_qr_code = COALESCE(
        NULLIF(product_label_qr_code, ''),
        COALESCE(NULLIF(claim_code, ''), CONCAT('digitalseal://label/', item_serial))
    ),
    certificate_qr_code = COALESCE(NULLIF(certificate_qr_code, ''), CONCAT('digitalseal://certificate/', item_serial));

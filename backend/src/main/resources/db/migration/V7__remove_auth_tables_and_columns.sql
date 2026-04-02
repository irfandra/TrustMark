-- Remove authentication module persistence artifacts.

DROP PROCEDURE IF EXISTS migrate_v7_remove_auth;
DELIMITER //
CREATE PROCEDURE migrate_v7_remove_auth()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'refresh_tokens'
  ) THEN
    DROP TABLE refresh_tokens;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'verification_codes'
  ) THEN
    DROP TABLE verification_codes;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND constraint_name = 'chk_auth_email'
  ) THEN
    ALTER TABLE users DROP CHECK chk_auth_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND constraint_name = 'chk_auth_wallet'
  ) THEN
    ALTER TABLE users DROP CHECK chk_auth_wallet;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND constraint_name = 'chk_auth_both'
  ) THEN
    ALTER TABLE users DROP CHECK chk_auth_both;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'idx_auth_type'
  ) THEN
    ALTER TABLE users DROP INDEX idx_auth_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'auth_type'
  ) THEN
    ALTER TABLE users DROP COLUMN auth_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users DROP COLUMN password_hash;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users DROP COLUMN email_verified;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'wallet_verified'
  ) THEN
    ALTER TABLE users DROP COLUMN wallet_verified;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE users DROP COLUMN is_locked;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE users DROP COLUMN failed_login_attempts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'last_failed_login_at'
  ) THEN
    ALTER TABLE users DROP COLUMN last_failed_login_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users DROP COLUMN last_login_at;
  END IF;
END //
DELIMITER ;

CALL migrate_v7_remove_auth();
DROP PROCEDURE IF EXISTS migrate_v7_remove_auth;

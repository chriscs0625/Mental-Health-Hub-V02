-- ============================================================
-- MENTAL BALANCE HUB — COMPLETE DATABASE SCHEMA
-- Run this entire file once in MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS mental_balance_hub;
USE mental_balance_hub;

-- ─────────────────────────────────────────
-- TABLE 1: users (customers)
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  phone         VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_verified   BOOLEAN DEFAULT FALSE,     -- email OTP verified
  is_banned     BOOLEAN DEFAULT FALSE,
  avatar_url    VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- ─────────────────────────────────────────
-- TABLE 2: admins (separate from users — NEVER share table)
-- ─────────────────────────────────────────
CREATE TABLE admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash      VARCHAR(255) NOT NULL,   -- bcrypt hashed 6-digit PIN
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLE 3: admin_lockouts (track failed PIN attempts)
-- ─────────────────────────────────────────
CREATE TABLE admin_lockouts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT NOT NULL,
  attempts      INT DEFAULT 0,
  locked_until  TIMESTAMP NULL,   -- NULL means not locked
  last_attempt  TIMESTAMP NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- ─────────────────────────────────────────
-- TABLE 4: otp_codes (email verification + password reset OTPs)
-- ─────────────────────────────────────────
CREATE TABLE otp_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  code        VARCHAR(10) NOT NULL,
  type        ENUM('email_verify','password_reset') NOT NULL,
  expires_at  TIMESTAMP NOT NULL,   -- 10 mins for OTP, 15 for reset
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- TABLE 5: password_reset_tokens (link-based reset)
-- ─────────────────────────────────────────
CREATE TABLE password_reset_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,  -- UUID, sent in email link
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- TABLE 6: categories
-- ─────────────────────────────────────────
CREATE TABLE categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLE 7: products
-- ─────────────────────────────────────────
CREATE TABLE products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  category_id     INT NOT NULL,
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(200) NOT NULL UNIQUE,
  description     TEXT,
  short_desc      VARCHAR(300),
  regular_price   DECIMAL(10,2) NOT NULL,
  sale_price      DECIMAL(10,2) NULL,        -- NULL = no discount
  thumbnail_path  VARCHAR(255),              -- product cover image
  status          ENUM('published','draft') DEFAULT 'draft',
  total_sales     INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ─────────────────────────────────────────
-- TABLE 8: product_files (the ACTUAL downloadable PDFs)
-- Stored separately — NEVER exposed via public URL
-- ─────────────────────────────────────────
CREATE TABLE product_files (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL UNIQUE,   -- one file per product (or update for bundles)
  file_path    VARCHAR(500) NOT NULL, -- path on server disk (not public URL)
  file_name    VARCHAR(255) NOT NULL,
  file_size_kb INT,
  uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- TABLE 9: cart_items (server-side cart — persists across devices)
-- ─────────────────────────────────────────
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_item (user_id, product_id), -- no duplicates
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─────────────────────────────────────────
-- TABLE 10: orders
-- ─────────────────────────────────────────
CREATE TABLE orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_ref        VARCHAR(20) NOT NULL UNIQUE,   -- e.g. MB-2291
  user_id          INT NOT NULL,
  subtotal         DECIMAL(10,2) NOT NULL,
  discount_amount  DECIMAL(10,2) DEFAULT 0,
  total_amount     DECIMAL(10,2) NOT NULL,
  promo_code       VARCHAR(50) NULL,
  payment_method   ENUM('card','bank_transfer') NOT NULL,
  status           ENUM('pending_verification','completed','rejected','refunded') NOT NULL,
  stripe_payment_id VARCHAR(255) NULL,   -- filled for card payments
  rejection_reason VARCHAR(500) NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- TABLE 11: order_items (which products are in each order)
-- ─────────────────────────────────────────
CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  price_paid  DECIMAL(10,2) NOT NULL,   -- snapshot of price at time of purchase
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─────────────────────────────────────────
-- TABLE 12: payment_slips (bank transfer evidence)
-- ─────────────────────────────────────────
CREATE TABLE payment_slips (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL UNIQUE,
  file_path     VARCHAR(500) NOT NULL,   -- stored securely, not public
  file_name     VARCHAR(255),
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by   INT NULL,               -- admin_id who reviewed it
  reviewed_at   TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(id)
);

-- ─────────────────────────────────────────
-- TABLE 13: download_tokens (time-limited, gated access)
-- Generated ONLY when order.status = 'completed'
-- ─────────────────────────────────────────
CREATE TABLE download_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  token       VARCHAR(255) NOT NULL UNIQUE,   -- UUID, sent in email + shown in dashboard
  user_id     INT NOT NULL,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  expires_at  TIMESTAMP NOT NULL,   -- 1 hour from generation
  used_count  INT DEFAULT 0,
  max_uses    INT DEFAULT 5,        -- prevents infinite sharing
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─────────────────────────────────────────
-- TABLE 14: audit_logs (every admin action recorded)
-- ─────────────────────────────────────────
CREATE TABLE audit_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT NULL,              -- NULL for system events
  action_type   ENUM(
    'login','logout',
    'order_approved','order_rejected',
    'product_added','product_updated','product_deleted',
    'refund_approved','refund_rejected',
    'customer_banned','customer_restored',
    'settings_updated','pin_reset'
  ) NOT NULL,
  target_type   VARCHAR(50),          -- 'order', 'product', 'customer'
  target_id     VARCHAR(50),          -- the ID of the thing acted on
  description   VARCHAR(500),
  ip_address    VARCHAR(45),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- ─────────────────────────────────────────
-- TABLE 15: store_settings (key-value config)
-- ─────────────────────────────────────────
CREATE TABLE store_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLE 16: refund_requests
-- ─────────────────────────────────────────
CREATE TABLE refund_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL UNIQUE,
  user_id      INT NOT NULL,
  reason       TEXT,
  status       ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by  INT NULL,
  reviewed_at  TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES admins(id)
);

-- ─────────────────────────────────────────
-- SEED: Insert default categories
-- ─────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Worksheets', 'worksheets'),
  ('Journals', 'journals'),
  ('Bundles', 'bundles'),
  ('Affirmation Cards', 'affirmation-cards'),
  ('Therapy Tools', 'therapy-tools');

-- ─────────────────────────────────────────
-- SEED: Insert default store settings
-- ─────────────────────────────────────────
INSERT INTO store_settings (setting_key, setting_value) VALUES
  ('store_name', 'Mental Balance Hub'),
  ('support_email', 'support@mentalbalancehub.com'),
  ('bank_name', 'Your Bank Name'),
  ('bank_account_name', 'Mental Balance Hub Ltd'),
  ('bank_account_number', 'XXXX-XXXX-XXXX'),
  ('bank_branch_code', 'XXXXXXXX'),
  ('verification_sla', '2-4 hours'),
  ('notify_new_order', 'true'),
  ('notify_slip_upload', 'true'),
  ('notify_refund_request', 'true');

-- ─────────────────────────────────────────
-- SEED: Insert first admin (PIN = 123456 bcrypt hashed below)
-- IMPORTANT: After inserting, change PIN immediately in Settings
-- To generate proper hashed PIN: run generateHash.js (Phase 2)
-- ─────────────────────────────────────────
-- INSERT INTO admins (full_name, email, password_hash, pin_hash) VALUES
-- ('System Admin', 'admin@mentalbalancehub.com', '$BCRYPT_PW_HASH', '$BCRYPT_PIN_HASH');
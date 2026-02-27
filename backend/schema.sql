CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('subscriber','admin','superadmin') NOT NULL DEFAULT 'subscriber',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  plan_code ENUM('free','pro','unlimited') NOT NULL DEFAULT 'free',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_code ENUM('free','pro','unlimited') NOT NULL,
  status ENUM('active','canceled') NOT NULL DEFAULT 'active',
  monthly_quota INT NULL,
  price_usd_cents INT NOT NULL DEFAULT 0,
  started_at DATETIME NOT NULL,
  renews_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subscriptions_user (user_id),
  KEY idx_subscriptions_user_status (user_id, status),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usage_counters (
  subject_type ENUM('user','guest') NOT NULL,
  subject_key VARCHAR(191) NOT NULL,
  period_key CHAR(7) NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (subject_type, subject_key, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usage_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_type ENUM('user','guest') NOT NULL,
  subject_key VARCHAR(191) NOT NULL,
  period_key CHAR(7) NOT NULL,
  plan_code ENUM('guest','free','pro','unlimited') NOT NULL,
  event_type ENUM('generate') NOT NULL DEFAULT 'generate',
  request_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_usage_events_subject (subject_type, subject_key, created_at),
  KEY idx_usage_events_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saved_prompts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  request_id VARCHAR(64) NOT NULL,
  model VARCHAR(80) NOT NULL DEFAULT '',
  prompt_text TEXT NOT NULL,
  image_url TEXT NULL,
  source_page_url TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_prompts_request (request_id),
  KEY idx_saved_prompts_user (user_id, created_at),
  CONSTRAINT fk_saved_prompts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_user_id BIGINT UNSIGNED NULL,
  meta_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_actor (actor_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS billing_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  stripe_customer_id VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_billing_profiles_customer (stripe_customer_id),
  CONSTRAINT fk_billing_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  stripe_subscription_id VARCHAR(191) NOT NULL,
  stripe_customer_id VARCHAR(191) NOT NULL,
  plan_code ENUM('free','pro','unlimited') NOT NULL DEFAULT 'free',
  status VARCHAR(64) NOT NULL,
  current_period_end DATETIME NULL,
  cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_subscriptions_subscription (stripe_subscription_id),
  KEY idx_billing_subscriptions_user (user_id),
  CONSTRAINT fk_billing_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stripe_event_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_webhook_events_event (stripe_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS billing_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  razorpay_order_id VARCHAR(191) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_code ENUM('pro','unlimited') NOT NULL,
  billing_cycle ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  amount_subunits INT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
  razorpay_payment_id VARCHAR(191) NULL,
  razorpay_signature VARCHAR(191) NULL,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_orders_order (razorpay_order_id),
  KEY idx_billing_orders_user (user_id, created_at),
  CONSTRAINT fk_billing_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

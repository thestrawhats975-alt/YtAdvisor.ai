-- Tier enum
CREATE TYPE user_tier AS ENUM ('STARTER', 'PRO', 'ULTIMATE');

-- Extend users table
ALTER TABLE users ADD COLUMN tier user_tier NOT NULL DEFAULT 'STARTER';
ALTER TABLE users ADD COLUMN requests_this_week INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN week_reset_at TIMESTAMPTZ NOT NULL DEFAULT now();
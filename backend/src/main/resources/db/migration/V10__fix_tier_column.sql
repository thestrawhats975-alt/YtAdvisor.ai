-- Step 1: Drop the default values that reference the user_tier enum
ALTER TABLE users ALTER COLUMN tier DROP DEFAULT;
ALTER TABLE subscriptions ALTER COLUMN tier DROP DEFAULT;

-- Step 2: Convert columns from native enum to VARCHAR
ALTER TABLE users
    ALTER COLUMN tier TYPE VARCHAR(50)
    USING tier::VARCHAR;

ALTER TABLE subscriptions
    ALTER COLUMN tier TYPE VARCHAR(50)
    USING tier::VARCHAR;

-- Step 3: Re-add defaults as plain strings
ALTER TABLE users ALTER COLUMN tier SET DEFAULT 'STARTER';
ALTER TABLE subscriptions ALTER COLUMN tier SET DEFAULT 'STARTER';

-- Step 4: Now safe to drop the type
DROP TYPE IF EXISTS user_tier;

-- Step 5: Add check constraints
ALTER TABLE users
    ADD CONSTRAINT chk_user_tier
    CHECK (tier IN ('STARTER', 'PRO', 'ULTIMATE'));

ALTER TABLE subscriptions
    ADD CONSTRAINT chk_subscription_tier
    CHECK (tier IN ('STARTER', 'PRO', 'ULTIMATE'));
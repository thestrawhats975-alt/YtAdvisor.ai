CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Lifetime counts
    total_analyses_run INT NOT NULL DEFAULT 0,
    total_pro_activations INT NOT NULL DEFAULT 0,      -- how many times went PRO
    total_ultimate_activations INT NOT NULL DEFAULT 0, -- how many times went ULTIMATE
    total_downgrades INT NOT NULL DEFAULT 0,           -- paid → lower tier

    -- Channel
    channel_connected_at TIMESTAMPTZ,                  -- first time they connected a channel
    pipeline_completed_at TIMESTAMPTZ,                 -- first time DNA became reliable

    -- Engagement
    first_analysis_at TIMESTAMPTZ,
    last_analysis_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
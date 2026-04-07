CREATE TABLE pipeline_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL UNIQUE REFERENCES channels(id) ON DELETE CASCADE,
    phase VARCHAR(50) NOT NULL DEFAULT 'BOOTSTRAPPING',
    total_videos_on_channel INT DEFAULT 0,
    videos_processed INT DEFAULT 0,
    current_batch_index INT DEFAULT 0,
    is_reliable BOOLEAN DEFAULT FALSE,
    consecutive_failures INT DEFAULT 0,
    last_error TEXT,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
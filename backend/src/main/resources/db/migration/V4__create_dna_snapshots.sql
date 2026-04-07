CREATE TABLE dna_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    dna_summary TEXT,
    audience_age_range VARCHAR(255),
    preferred_format VARCHAR(255),
    engagement_tone VARCHAR(255),
    recurring_questions JSONB,
    content_wants_more JSONB,
    content_complaints JSONB,
    total_comments_analysed INT DEFAULT 0,
    videos_processed INT DEFAULT 0,
    is_reliable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dna_snapshots_channel_id ON dna_snapshots(channel_id);
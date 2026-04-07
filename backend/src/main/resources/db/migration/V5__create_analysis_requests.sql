CREATE TABLE analysis_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    channel_id UUID REFERENCES channels(id),
    video_idea TEXT NOT NULL,
    creator_dna_used TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_analysis_requests_user_id ON analysis_requests(user_id);
CREATE TABLE analysis_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES analysis_requests(id),
    raw_response JSONB NOT NULL,
    final_verdict VARCHAR(50),
    confidence VARCHAR(50),
    small_creator_verdict VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
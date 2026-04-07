CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    youtube_channel_id VARCHAR(255) NOT NULL,
    channel_title VARCHAR(512),
    subscriber_count BIGINT DEFAULT 0,
    total_video_count INT DEFAULT 0,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE analysis_responses
    ALTER COLUMN raw_response TYPE TEXT
    USING raw_response::TEXT;

ALTER TABLE dna_snapshots
    ALTER COLUMN recurring_questions TYPE TEXT
    USING recurring_questions::TEXT;

ALTER TABLE dna_snapshots
    ALTER COLUMN content_wants_more TYPE TEXT
    USING content_wants_more::TEXT;

ALTER TABLE dna_snapshots
    ALTER COLUMN content_complaints TYPE TEXT
    USING content_complaints::TEXT;
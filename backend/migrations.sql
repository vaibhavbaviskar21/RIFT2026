-- Migration: Add search history and advanced analysis tables

-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    risk_label VARCHAR(50),
    searched_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user_search FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_date ON search_history(searched_at DESC);

-- Advanced Analyses Table
CREATE TABLE IF NOT EXISTS advanced_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    harmful_drugs JSONB NOT NULL DEFAULT '[]',
    safe_drugs JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '{}',
    full_report JSONB NOT NULL DEFAULT '""',
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user_advanced FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_advanced_analyses_user ON advanced_analyses(user_id);

-- Comments
COMMENT ON TABLE search_history IS 'Stores user drug search history';
COMMENT ON TABLE advanced_analyses IS 'Stores comprehensive genetic analysis (one per user)';

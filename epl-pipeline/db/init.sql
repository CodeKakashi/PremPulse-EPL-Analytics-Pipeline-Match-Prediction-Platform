-- ============================================================
-- EPL Pipeline: PostgreSQL Schema Initialization
-- Creates the raw_matches table for ingested match data
-- ============================================================

CREATE TABLE IF NOT EXISTS raw_matches (
    id              SERIAL PRIMARY KEY,
    season          VARCHAR(10),
    match_date      DATE,
    home_team       VARCHAR(50),
    away_team       VARCHAR(50),
    ft_home_goals   INTEGER,
    ft_away_goals   INTEGER,
    ft_result       VARCHAR(1),
    ht_home_goals   INTEGER,
    ht_away_goals   INTEGER,
    ht_result       VARCHAR(1),
    home_shots      INTEGER,
    away_shots      INTEGER,
    home_shots_on_target INTEGER,
    away_shots_on_target INTEGER,
    home_corners    INTEGER,
    away_corners    INTEGER,
    home_fouls      INTEGER,
    away_fouls      INTEGER,
    home_yellow_cards INTEGER,
    away_yellow_cards INTEGER,
    home_red_cards  INTEGER,
    away_red_cards  INTEGER,
    ingested_at     TIMESTAMP DEFAULT NOW(),
    source          VARCHAR(20) DEFAULT 'csv'
);

-- Index for fast lookups by date and team
CREATE INDEX IF NOT EXISTS idx_raw_matches_date ON raw_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_raw_matches_home ON raw_matches(home_team);
CREATE INDEX IF NOT EXISTS idx_raw_matches_source ON raw_matches(source);
CREATE INDEX IF NOT EXISTS idx_raw_matches_ingested ON raw_matches(ingested_at);

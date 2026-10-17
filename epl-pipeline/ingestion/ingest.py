"""
EPL Data Ingestion Service
──────────────────────────
1. Seeds historical CSV data into PostgreSQL on first run
2. Generates realistic mock EPL match data every 60 seconds
"""

import os
import csv
import random
import logging
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_values
from apscheduler.schedulers.blocking import BlockingScheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]

EPL_TEAMS_2024 = [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
    "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich",
    "Leicester", "Liverpool", "Man City", "Man United", "Newcastle",
    "Nott'm Forest", "Southampton", "Tottenham", "West Ham", "Wolves",
]


# ── Database helpers ─────────────────────────────────────────

def get_connection():
    """Return a new psycopg2 connection."""
    return psycopg2.connect(DATABASE_URL)


INSERT_SQL = """
    INSERT INTO raw_matches (
        season, match_date, home_team, away_team,
        ft_home_goals, ft_away_goals, ft_result,
        ht_home_goals, ht_away_goals, ht_result,
        home_shots, away_shots,
        home_shots_on_target, away_shots_on_target,
        home_corners, away_corners,
        home_fouls, away_fouls,
        home_yellow_cards, away_yellow_cards,
        home_red_cards, away_red_cards,
        source
    ) VALUES %s
"""


# ── CSV Seeding ──────────────────────────────────────────────

def seed_csv(csv_path: str) -> None:
    """Load the historical CSV dataset into raw_matches (idempotent)."""
    if not os.path.exists(csv_path):
        logger.warning("CSV file not found at %s – skipping seed", csv_path)
        return

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM raw_matches WHERE source = 'csv'")
    existing = cur.fetchone()[0]
    if existing > 0:
        logger.info("CSV already seeded (%d rows). Skipping.", existing)
        conn.close()
        return

    logger.info("Seeding CSV data from %s …", csv_path)
    rows = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append((
                row["Season"],
                row["MatchDate"],
                row["HomeTeam"],
                row["AwayTeam"],
                int(row["FullTimeHomeGoals"]),
                int(row["FullTimeAwayGoals"]),
                row["FullTimeResult"],
                int(row["HalfTimeHomeGoals"]),
                int(row["HalfTimeAwayGoals"]),
                row["HalfTimeResult"],
                int(row["HomeShots"]),
                int(row["AwayShots"]),
                int(row["HomeShotsOnTarget"]),
                int(row["AwayShotsOnTarget"]),
                int(row["HomeCorners"]),
                int(row["AwayCorners"]),
                int(row["HomeFouls"]),
                int(row["AwayFouls"]),
                int(row["HomeYellowCards"]),
                int(row["AwayYellowCards"]),
                int(row["HomeRedCards"]),
                int(row["AwayRedCards"]),
                "csv",
            ))

    execute_values(cur, INSERT_SQL, rows, page_size=500)
    conn.commit()
    logger.info("✓ Seeded %d rows from CSV.", len(rows))
    conn.close()


# ── Mock Data Generator ─────────────────────────────────────

def _generate_mock_match() -> tuple:
    """Return one tuple of realistic EPL match statistics."""
    home, away = random.sample(EPL_TEAMS_2024, 2)

    # Weighted goal distributions (Poisson-like)
    hg = random.choices(range(7), weights=[25, 32, 22, 12, 5, 3, 1])[0]
    ag = random.choices(range(7), weights=[30, 32, 20, 10, 5, 2, 1])[0]

    ft_result = "H" if hg > ag else ("A" if ag > hg else "D")

    ht_hg = random.randint(0, hg)
    ht_ag = random.randint(0, ag)
    ht_result = "H" if ht_hg > ht_ag else ("A" if ht_ag > ht_hg else "D")

    h_sot = hg + random.randint(1, 6)
    a_sot = ag + random.randint(1, 5)

    return (
        "2024/25",
        datetime.now().strftime("%Y-%m-%d"),
        home,
        away,
        hg,
        ag,
        ft_result,
        ht_hg,
        ht_ag,
        ht_result,
        h_sot + random.randint(2, 8),   # total home shots
        a_sot + random.randint(1, 7),    # total away shots
        h_sot,
        a_sot,
        random.randint(2, 12),           # corners
        random.randint(2, 10),
        random.randint(6, 18),           # fouls
        random.randint(6, 18),
        random.randint(0, 5),            # yellow cards
        random.randint(0, 5),
        random.choices([0, 1], weights=[90, 10])[0],  # red cards
        random.choices([0, 1], weights=[90, 10])[0],
        "mock",
    )


def ingest_mock_batch() -> None:
    """Generate and insert a small batch of mock matches."""
    batch_size = random.randint(2, 5)
    rows = [_generate_mock_match() for _ in range(batch_size)]

    conn = get_connection()
    cur = conn.cursor()
    execute_values(cur, INSERT_SQL, rows)
    conn.commit()
    conn.close()
    logger.info("⚽ Ingested %d mock matches.", batch_size)


# ── Entrypoint ───────────────────────────────────────────────

def main() -> None:
    logger.info("═══ EPL Ingestion Service Starting ═══")

    # Step 1 – seed CSV data
    seed_csv("/app/data/epl_final.csv")

    # Step 2 – schedule periodic mock ingestion
    logger.info("Scheduling mock-data ingestion every 60 s …")
    scheduler = BlockingScheduler()
    scheduler.add_job(ingest_mock_batch, "interval", seconds=60, id="mock_ingest")
    # Fire one batch immediately so dbt has fresh data to transform
    ingest_mock_batch()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Ingestion service stopped.")


if __name__ == "__main__":
    main()

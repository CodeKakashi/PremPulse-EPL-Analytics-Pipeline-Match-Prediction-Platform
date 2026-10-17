import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Helper: safely query a table that may not exist yet ─────
async function safeQuery<T>(
  sql: string,
  fallback: T
): Promise<T> {
  try {
    const res = await pool.query(sql);
    return res.rows as T;
  } catch {
    return fallback;
  }
}

async function safeCount(table: string): Promise<number> {
  try {
    const res = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    return res.rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

// ── GET /api/metrics ────────────────────────────────────────
export async function GET() {
  try {
    // 1. Row counts
    const [rawCount, stagedCount, featureCount] = await Promise.all([
      safeCount("raw_matches"),
      safeCount("stg_matches"),
      safeCount("epl_features"),
    ]);

    // 2. Latest ingestion timestamp
    const latestRows = await safeQuery<{ latest: string | null }[]>(
      "SELECT MAX(ingested_at)::text AS latest FROM raw_matches",
      [{ latest: null }]
    );
    const latestIngestion = latestRows[0]?.latest ?? null;

    // 3. Source breakdown
    const sourceBreakdown = await safeQuery<
      { source: string; count: number }[]
    >(
      "SELECT source, COUNT(*)::int AS count FROM raw_matches GROUP BY source ORDER BY source",
      []
    );

    // 4. Unique counts
    const uniqueRows = await safeQuery<
      { teams: number; seasons: number }[]
    >(
      `SELECT
         COUNT(DISTINCT home_team)::int AS teams,
         COUNT(DISTINCT season)::int    AS seasons
       FROM raw_matches`,
      [{ teams: 0, seasons: 0 }]
    );

    // 5. Data quality – null counts per key column
    const qualityRows = await safeQuery<
      {
        column_name: string;
        total_rows: number;
        null_count: number;
        completeness: number;
      }[]
    >(
      `SELECT column_name, total_rows, null_count,
              ROUND(((total_rows - null_count)::numeric / NULLIF(total_rows, 0)) * 100, 2) AS completeness
       FROM (
         SELECT 'season'           AS column_name, COUNT(*)::int AS total_rows, SUM(CASE WHEN season            IS NULL THEN 1 ELSE 0 END)::int AS null_count FROM raw_matches UNION ALL
         SELECT 'match_date',                      COUNT(*)::int,               SUM(CASE WHEN match_date        IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'home_team',                       COUNT(*)::int,               SUM(CASE WHEN home_team         IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'away_team',                       COUNT(*)::int,               SUM(CASE WHEN away_team         IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'ft_home_goals',                   COUNT(*)::int,               SUM(CASE WHEN ft_home_goals     IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'ft_away_goals',                   COUNT(*)::int,               SUM(CASE WHEN ft_away_goals     IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'ft_result',                       COUNT(*)::int,               SUM(CASE WHEN ft_result         IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'home_shots',                      COUNT(*)::int,               SUM(CASE WHEN home_shots        IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'away_shots',                      COUNT(*)::int,               SUM(CASE WHEN away_shots        IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'home_shots_on_target',            COUNT(*)::int,               SUM(CASE WHEN home_shots_on_target IS NULL THEN 1 ELSE 0 END)::int            FROM raw_matches UNION ALL
         SELECT 'away_shots_on_target',            COUNT(*)::int,               SUM(CASE WHEN away_shots_on_target IS NULL THEN 1 ELSE 0 END)::int            FROM raw_matches UNION ALL
         SELECT 'home_corners',                    COUNT(*)::int,               SUM(CASE WHEN home_corners      IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches UNION ALL
         SELECT 'away_corners',                    COUNT(*)::int,               SUM(CASE WHEN away_corners      IS NULL THEN 1 ELSE 0 END)::int               FROM raw_matches
       ) sub
       ORDER BY completeness ASC, column_name`,
      []
    );

    // 6. Recent ingestion batches (grouped by ingested_at + source)
    const recentIngestions = await safeQuery<
      { ingested_at: string; source: string; row_count: number }[]
    >(
      `SELECT
         ingested_at::text,
         source,
         COUNT(*)::int AS row_count
       FROM raw_matches
       GROUP BY ingested_at, source
       ORDER BY ingested_at DESC
       LIMIT 15`,
      []
    );

    // 7. Table status
    const tableStatus = [
      { name: "raw_matches", exists: rawCount > 0, rowCount: rawCount },
      { name: "stg_matches", exists: stagedCount > 0, rowCount: stagedCount },
      { name: "epl_features", exists: featureCount > 0, rowCount: featureCount },
    ];

    return NextResponse.json({
      overview: {
        totalRawRows: rawCount,
        totalStagedRows: stagedCount,
        totalFeatureRows: featureCount,
        latestIngestion,
        uniqueTeams: uniqueRows[0]?.teams ?? 0,
        uniqueSeasons: uniqueRows[0]?.seasons ?? 0,
        sourceBreakdown,
      },
      quality: qualityRows,
      recentIngestions,
      tableStatus,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

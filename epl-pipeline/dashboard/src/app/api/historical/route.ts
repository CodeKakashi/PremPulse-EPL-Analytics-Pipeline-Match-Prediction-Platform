import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const season = searchParams.get("season") || "all";
    const team = searchParams.get("team") || "all";
    const result = searchParams.get("result") || "all";
    const sort = searchParams.get("sort") || "date_desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(home_team ILIKE $${paramIdx} OR away_team ILIKE $${paramIdx})`);
      values.push(`%${search}%`);
      paramIdx++;
    }

    if (season !== "all") {
      conditions.push(`season = $${paramIdx}`);
      values.push(season);
      paramIdx++;
    }

    if (team !== "all") {
      conditions.push(`(home_team = $${paramIdx} OR away_team = $${paramIdx})`);
      values.push(team);
      paramIdx++;
    }

    if (result !== "all" && ["H", "D", "A"].includes(result)) {
      conditions.push(`ft_result = $${paramIdx}`);
      values.push(result);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderByClause = "ORDER BY match_date DESC, id DESC";
    if (sort === "date_asc") {
      orderByClause = "ORDER BY match_date ASC, id ASC";
    } else if (sort === "goals_desc") {
      orderByClause = "ORDER BY (ft_home_goals + ft_away_goals) DESC, match_date DESC";
    } else if (sort === "shots_desc") {
      orderByClause = "ORDER BY (COALESCE(home_shots, 0) + COALESCE(away_shots, 0)) DESC, match_date DESC";
    }

    // 1. Total count and summary of filtered query
    const countSql = `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(ft_home_goals + ft_away_goals), 0)::int AS total_goals,
        COALESCE(AVG(ft_home_goals + ft_away_goals), 0)::numeric(10,2) AS avg_goals,
        COUNT(*) FILTER (WHERE ft_result = 'H')::int AS home_wins,
        COUNT(*) FILTER (WHERE ft_result = 'D')::int AS draws,
        COUNT(*) FILTER (WHERE ft_result = 'A')::int AS away_wins
      FROM raw_matches
      ${whereClause}
    `;
    const countRes = await pool.query(countSql, values);
    const summaryRow = countRes.rows[0];
    const total = summaryRow?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // 2. Paginated data query
    const dataSql = `
      SELECT
        id,
        season,
        match_date::text AS match_date,
        home_team,
        away_team,
        ft_home_goals,
        ft_away_goals,
        ft_result,
        ht_home_goals,
        ht_away_goals,
        ht_result,
        home_shots,
        away_shots,
        home_shots_on_target,
        away_shots_on_target,
        home_corners,
        away_corners,
        home_fouls,
        away_fouls,
        home_yellow_cards,
        away_yellow_cards,
        home_red_cards,
        away_red_cards,
        source
      FROM raw_matches
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const dataValues = [...values, limit, offset];
    const dataRes = await pool.query(dataSql, dataValues);

    return NextResponse.json({
      matches: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalGoals: summaryRow?.total_goals || 0,
        avgGoals: Number(summaryRow?.avg_goals || 0),
        homeWins: summaryRow?.home_wins || 0,
        draws: summaryRow?.draws || 0,
        awayWins: summaryRow?.away_wins || 0,
      },
    });
  } catch (error) {
    console.error("Historical API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}

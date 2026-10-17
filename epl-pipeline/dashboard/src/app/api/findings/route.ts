import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Overall outcomes and goal statistics
    const totalsRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total_matches,
         COUNT(*) FILTER (WHERE ft_result = 'H')::int AS home_wins,
         COUNT(*) FILTER (WHERE ft_result = 'D')::int AS draws,
         COUNT(*) FILTER (WHERE ft_result = 'A')::int AS away_wins,
         SUM(ft_home_goals + ft_away_goals)::int AS total_goals,
         AVG(ft_home_goals + ft_away_goals)::numeric(10,2) AS avg_goals,
         COUNT(*) FILTER (WHERE (ft_home_goals + ft_away_goals) > 1.5)::int AS over_15,
         COUNT(*) FILTER (WHERE (ft_home_goals + ft_away_goals) > 2.5)::int AS over_25,
         COUNT(*) FILTER (WHERE (ft_home_goals + ft_away_goals) > 3.5)::int AS over_35,
         COUNT(*) FILTER (WHERE ft_home_goals > 0 AND ft_away_goals > 0)::int AS btts_count,
         COUNT(*) FILTER (WHERE ft_home_goals = 0 OR ft_away_goals = 0)::int AS clean_sheet_matches,
         SUM(home_yellow_cards + away_yellow_cards)::int AS total_yellows,
         SUM(home_red_cards + away_red_cards)::int AS total_reds
       FROM raw_matches`
    );
    const totals = totalsRes.rows[0];
    const totalMatches = totals.total_matches || 1;

    // 2. Halftime lead persistence & comeback rate
    const htLeadRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE ht_result IN ('H', 'A'))::int AS matches_with_ht_leader,
         COUNT(*) FILTER (WHERE (ht_result = 'H' AND ft_result = 'H') OR (ht_result = 'A' AND ft_result = 'A'))::int AS ht_leader_won,
         COUNT(*) FILTER (WHERE (ht_result = 'H' AND ft_result = 'A') OR (ht_result = 'A' AND ft_result = 'H'))::int AS comeback_wins,
         COUNT(*) FILTER (WHERE ht_result IN ('H', 'A') AND ft_result = 'D')::int AS ht_lead_draws
       FROM raw_matches`
    );
    const ht = htLeadRes.rows[0];

    // 3. Red card impact analysis
    const redCardRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE home_red_cards > 0 OR away_red_cards > 0)::int AS matches_with_red,
         COUNT(*) FILTER (WHERE home_red_cards > 0 AND ft_result = 'A')::int AS home_red_away_won,
         COUNT(*) FILTER (WHERE away_red_cards > 0 AND ft_result = 'H')::int AS away_red_home_won
       FROM raw_matches`
    );
    const red = redCardRes.rows[0];

    // 4. All-time top 15 Premier League Leaderboard
    const tableRes = await pool.query(
      `WITH match_points AS (
         SELECT
           home_team AS team,
           1 AS played,
           CASE WHEN ft_result = 'H' THEN 1 ELSE 0 END AS win,
           CASE WHEN ft_result = 'D' THEN 1 ELSE 0 END AS draw,
           CASE WHEN ft_result = 'A' THEN 1 ELSE 0 END AS loss,
           ft_home_goals AS gf,
           ft_away_goals AS ga,
           CASE WHEN ft_result = 'H' THEN 3 WHEN ft_result = 'D' THEN 1 ELSE 0 END AS points
         FROM raw_matches
         UNION ALL
         SELECT
           away_team AS team,
           1 AS played,
           CASE WHEN ft_result = 'A' THEN 1 ELSE 0 END AS win,
           CASE WHEN ft_result = 'D' THEN 1 ELSE 0 END AS draw,
           CASE WHEN ft_result = 'H' THEN 1 ELSE 0 END AS loss,
           ft_away_goals AS gf,
           ft_home_goals AS ga,
           CASE WHEN ft_result = 'A' THEN 3 WHEN ft_result = 'D' THEN 1 ELSE 0 END AS points
         FROM raw_matches
       )
       SELECT
         team,
         COUNT(*)::int AS played,
         SUM(win)::int AS wins,
         SUM(draw)::int AS draws,
         SUM(loss)::int AS losses,
         SUM(gf)::int AS goals_for,
         SUM(ga)::int AS goals_against,
         (SUM(gf) - SUM(ga))::int AS goal_diff,
         SUM(points)::int AS points,
         ROUND((SUM(win)::numeric / COUNT(*)) * 100, 1)::float AS win_pct
       FROM match_points
       WHERE team IS NOT NULL
       GROUP BY team
       ORDER BY points DESC, goal_diff DESC
       LIMIT 15`
    );

    // 5. Goals trend across seasons
    const seasonsRes = await pool.query(
      `SELECT
         season,
         COUNT(*)::int AS matches,
         SUM(ft_home_goals + ft_away_goals)::int AS goals,
         ROUND(AVG(ft_home_goals + ft_away_goals), 2)::float AS avg_goals,
         ROUND((COUNT(*) FILTER (WHERE ft_result = 'H')::numeric / COUNT(*)) * 100, 1)::float AS home_win_pct
       FROM raw_matches
       WHERE season IS NOT NULL
       GROUP BY season
       ORDER BY season ASC`
    );

    return NextResponse.json({
      summary: {
        totalMatches,
        totalGoals: totals.total_goals,
        avgGoalsPerMatch: Number(totals.avg_goals),
        homeWins: totals.home_wins,
        draws: totals.draws,
        awayWins: totals.away_wins,
        homeWinPct: Number(((totals.home_wins / totalMatches) * 100).toFixed(1)),
        drawPct: Number(((totals.draws / totalMatches) * 100).toFixed(1)),
        awayWinPct: Number(((totals.away_wins / totalMatches) * 100).toFixed(1)),
        over15Pct: Number(((totals.over_15 / totalMatches) * 100).toFixed(1)),
        over25Pct: Number(((totals.over_25 / totalMatches) * 100).toFixed(1)),
        over35Pct: Number(((totals.over_35 / totalMatches) * 100).toFixed(1)),
        bttsPct: Number(((totals.btts_count / totalMatches) * 100).toFixed(1)),
        cleanSheetPct: Number(((totals.clean_sheet_matches / totalMatches) * 100).toFixed(1)),
        totalYellows: totals.total_yellows,
        totalReds: totals.total_reds,
        avgYellowsPerMatch: Number((totals.total_yellows / totalMatches).toFixed(2)),
        avgRedsPerMatch: Number((totals.total_reds / totalMatches).toFixed(2)),
      },
      turnarounds: {
        matchesWithHTLeader: ht.matches_with_ht_leader,
        htLeaderWon: ht.ht_leader_won,
        htLeaderWonPct: ht.matches_with_ht_leader > 0
          ? Number(((ht.ht_leader_won / ht.matches_with_ht_leader) * 100).toFixed(1))
          : 0,
        comebackWins: ht.comeback_wins,
        comebackPct: ht.matches_with_ht_leader > 0
          ? Number(((ht.comeback_wins / ht.matches_with_ht_leader) * 100).toFixed(1))
          : 0,
        drawsAfterHTLead: ht.ht_lead_draws,
      },
      discipline: {
        matchesWithRedCard: red.matches_with_red,
        redCardMatchPct: Number(((red.matches_with_red / totalMatches) * 100).toFixed(1)),
        homeRedAwayWon: red.home_red_away_won,
        awayRedHomeWon: red.away_red_home_won,
      },
      leaderboard: tableRes.rows,
      seasonTrends: seasonsRes.rows,
    });
  } catch (error) {
    console.error("Findings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch findings" },
      { status: 500 }
    );
  }
}

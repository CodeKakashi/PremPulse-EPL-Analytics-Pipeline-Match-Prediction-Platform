import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamA = searchParams.get("teamA") || "Arsenal";
    const teamB = searchParams.get("teamB") || "Chelsea";

    if (teamA === teamB) {
      return NextResponse.json(
        { error: "Please select two distinct teams to compare" },
        { status: 400 }
      );
    }

    // 1. All head-to-head matches
    const h2hRes = await pool.query(
      `SELECT
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
       WHERE (home_team = $1 AND away_team = $2)
          OR (home_team = $2 AND away_team = $1)
       ORDER BY match_date DESC`,
      [teamA, teamB]
    );

    const matches = h2hRes.rows;
    const totalMatches = matches.length;

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;

    let teamAGoals = 0;
    let teamBGoals = 0;

    let teamAShots = 0;
    let teamBShots = 0;
    let teamASOT = 0;
    let teamBSOT = 0;

    let teamACorners = 0;
    let teamBCorners = 0;

    let teamAFouls = 0;
    let teamBFouls = 0;

    let teamAYellow = 0;
    let teamBYellow = 0;

    let teamARed = 0;
    let teamBRed = 0;

    let teamAHomeMatches = 0;
    let teamAHomeWins = 0;
    let teamAHomeDraws = 0;
    let teamAHomeLosses = 0;
    let teamAHomeGoals = 0;
    let teamAHomeConceded = 0;

    let teamBHomeMatches = 0;
    let teamBHomeWins = 0;
    let teamBHomeDraws = 0;
    let teamBHomeLosses = 0;
    let teamBHomeGoals = 0;
    let teamBHomeConceded = 0;

    let biggestWinA: { diff: number; score: string; date: string; season: string } | null = null;
    let biggestWinB: { diff: number; score: string; date: string; season: string } | null = null;

    matches.forEach((m) => {
      const isAHome = m.home_team === teamA;
      const goalsA = isAHome ? m.ft_home_goals : m.ft_away_goals;
      const goalsB = isAHome ? m.ft_away_goals : m.ft_home_goals;

      teamAGoals += goalsA;
      teamBGoals += goalsB;

      teamAShots += isAHome ? (m.home_shots || 0) : (m.away_shots || 0);
      teamBShots += isAHome ? (m.away_shots || 0) : (m.home_shots || 0);

      teamASOT += isAHome ? (m.home_shots_on_target || 0) : (m.away_shots_on_target || 0);
      teamBSOT += isAHome ? (m.away_shots_on_target || 0) : (m.home_shots_on_target || 0);

      teamACorners += isAHome ? (m.home_corners || 0) : (m.away_corners || 0);
      teamBCorners += isAHome ? (m.away_corners || 0) : (m.home_corners || 0);

      teamAFouls += isAHome ? (m.home_fouls || 0) : (m.away_fouls || 0);
      teamBFouls += isAHome ? (m.away_fouls || 0) : (m.home_fouls || 0);

      teamAYellow += isAHome ? (m.home_yellow_cards || 0) : (m.away_yellow_cards || 0);
      teamBYellow += isAHome ? (m.away_yellow_cards || 0) : (m.home_yellow_cards || 0);

      teamARed += isAHome ? (m.home_red_cards || 0) : (m.away_red_cards || 0);
      teamBRed += isAHome ? (m.away_red_cards || 0) : (m.home_red_cards || 0);

      const diff = goalsA - goalsB;

      if (diff > 0) {
        teamAWins++;
        if (!biggestWinA || diff > biggestWinA.diff) {
          biggestWinA = {
            diff,
            score: `${goalsA}-${goalsB}`,
            date: m.match_date,
            season: m.season,
          };
        }
      } else if (diff < 0) {
        teamBWins++;
        const absDiff = Math.abs(diff);
        if (!biggestWinB || absDiff > biggestWinB.diff) {
          biggestWinB = {
            diff: absDiff,
            score: `${goalsB}-${goalsA}`,
            date: m.match_date,
            season: m.season,
          };
        }
      } else {
        draws++;
      }

      if (isAHome) {
        teamAHomeMatches++;
        teamAHomeGoals += goalsA;
        teamAHomeConceded += goalsB;
        if (diff > 0) teamAHomeWins++;
        else if (diff === 0) teamAHomeDraws++;
        else teamAHomeLosses++;
      } else {
        teamBHomeMatches++;
        teamBHomeGoals += goalsB;
        teamBHomeConceded += goalsA;
        if (diff < 0) teamBHomeWins++;
        else if (diff === 0) teamBHomeDraws++;
        else teamBHomeLosses++;
      }
    });

    // 2. Recent overall form for Team A (last 5 matches in the league)
    const formARes = await pool.query(
      `SELECT match_date::text AS match_date, home_team, away_team, ft_home_goals, ft_away_goals, ft_result
       FROM raw_matches
       WHERE home_team = $1 OR away_team = $1
       ORDER BY match_date DESC
       LIMIT 5`,
      [teamA]
    );

    const formA = formARes.rows.map((m) => {
      const isHome = m.home_team === teamA;
      const teamGoals = isHome ? m.ft_home_goals : m.ft_away_goals;
      const oppGoals = isHome ? m.ft_away_goals : m.ft_home_goals;
      const opponent = isHome ? m.away_team : m.home_team;
      let outcome = "D";
      if (teamGoals > oppGoals) outcome = "W";
      else if (teamGoals < oppGoals) outcome = "L";
      return {
        date: m.match_date,
        isHome,
        opponent,
        teamGoals,
        oppGoals,
        outcome,
      };
    });

    // 3. Recent overall form for Team B (last 5 matches in the league)
    const formBRes = await pool.query(
      `SELECT match_date::text AS match_date, home_team, away_team, ft_home_goals, ft_away_goals, ft_result
       FROM raw_matches
       WHERE home_team = $1 OR away_team = $1
       ORDER BY match_date DESC
       LIMIT 5`,
      [teamB]
    );

    const formB = formBRes.rows.map((m) => {
      const isHome = m.home_team === teamB;
      const teamGoals = isHome ? m.ft_home_goals : m.ft_away_goals;
      const oppGoals = isHome ? m.ft_away_goals : m.ft_home_goals;
      const opponent = isHome ? m.away_team : m.home_team;
      let outcome = "D";
      if (teamGoals > oppGoals) outcome = "W";
      else if (teamGoals < oppGoals) outcome = "L";
      return {
        date: m.match_date,
        isHome,
        opponent,
        teamGoals,
        oppGoals,
        outcome,
      };
    });

    const divisor = totalMatches > 0 ? totalMatches : 1;

    return NextResponse.json({
      teamA,
      teamB,
      totalMatches,
      record: {
        teamAWins,
        teamBWins,
        draws,
        teamAWinPct: totalMatches > 0 ? Number(((teamAWins / totalMatches) * 100).toFixed(1)) : 0,
        teamBWinPct: totalMatches > 0 ? Number(((teamBWins / totalMatches) * 100).toFixed(1)) : 0,
        drawPct: totalMatches > 0 ? Number(((draws / totalMatches) * 100).toFixed(1)) : 0,
      },
      goals: {
        teamAGoals,
        teamBGoals,
        teamAAvg: Number((teamAGoals / divisor).toFixed(2)),
        teamBAvg: Number((teamBGoals / divisor).toFixed(2)),
        totalGoals: teamAGoals + teamBGoals,
        avgMatchGoals: Number(((teamAGoals + teamBGoals) / divisor).toFixed(2)),
      },
      statsAvg: {
        teamAShots: Number((teamAShots / divisor).toFixed(1)),
        teamBShots: Number((teamBShots / divisor).toFixed(1)),
        teamASOT: Number((teamASOT / divisor).toFixed(1)),
        teamBSOT: Number((teamBSOT / divisor).toFixed(1)),
        teamACorners: Number((teamACorners / divisor).toFixed(1)),
        teamBCorners: Number((teamBCorners / divisor).toFixed(1)),
        teamAFouls: Number((teamAFouls / divisor).toFixed(1)),
        teamBFouls: Number((teamBFouls / divisor).toFixed(1)),
        teamAYellow: Number((teamAYellow / divisor).toFixed(1)),
        teamBYellow: Number((teamBYellow / divisor).toFixed(1)),
        teamARed,
        teamBRed,
      },
      homeAdvantage: {
        teamAAtHome: {
          played: teamAHomeMatches,
          wins: teamAHomeWins,
          draws: teamAHomeDraws,
          losses: teamAHomeLosses,
          goalsFor: teamAHomeGoals,
          goalsAgainst: teamAHomeConceded,
        },
        teamBAtHome: {
          played: teamBHomeMatches,
          wins: teamBHomeWins,
          draws: teamBHomeDraws,
          losses: teamBHomeLosses,
          goalsFor: teamBHomeGoals,
          goalsAgainst: teamBHomeConceded,
        },
      },
      biggestWins: {
        teamA: biggestWinA,
        teamB: biggestWinB,
      },
      formA,
      formB,
      recentMatches: matches.slice(0, 15),
    });
  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: "Failed to compare teams" },
      { status: 500 }
    );
  }
}

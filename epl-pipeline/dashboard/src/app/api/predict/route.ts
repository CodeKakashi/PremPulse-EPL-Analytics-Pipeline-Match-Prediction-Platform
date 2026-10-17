import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// Helper for factorial
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Poisson probability function
function poisson(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeTeam = searchParams.get("homeTeam") || "Arsenal";
    const awayTeam = searchParams.get("awayTeam") || "Chelsea";

    if (homeTeam === awayTeam) {
      return NextResponse.json(
        { error: "Home team and Away team must be different" },
        { status: 400 }
      );
    }

    // 1. League-wide averages
    const leagueAvgRes = await pool.query(
      `SELECT
         AVG(ft_home_goals)::numeric(10,3) AS avg_home_goals,
         AVG(ft_away_goals)::numeric(10,3) AS avg_away_goals
       FROM raw_matches`
    );
    const leagueAvgHome = Number(leagueAvgRes.rows[0]?.avg_home_goals || 1.53);
    const leagueAvgAway = Number(leagueAvgRes.rows[0]?.avg_away_goals || 1.15);

    // 2. Home team stats when playing at home
    const homeStatsRes = await pool.query(
      `SELECT
         COUNT(*)::int AS matches,
         COALESCE(AVG(ft_home_goals)::numeric(10,3), 1.5) AS scored_avg,
         COALESCE(AVG(ft_away_goals)::numeric(10,3), 1.1) AS conceded_avg,
         COUNT(*) FILTER (WHERE ft_result = 'H')::int AS wins,
         COUNT(*) FILTER (WHERE ft_result = 'D')::int AS draws,
         COUNT(*) FILTER (WHERE ft_result = 'A')::int AS losses
       FROM raw_matches
       WHERE home_team = $1`,
      [homeTeam]
    );
    const homeStats = homeStatsRes.rows[0] || { matches: 1, scored_avg: 1.5, conceded_avg: 1.1, wins: 0, draws: 0, losses: 0 };

    // 3. Away team stats when playing away
    const awayStatsRes = await pool.query(
      `SELECT
         COUNT(*)::int AS matches,
         COALESCE(AVG(ft_away_goals)::numeric(10,3), 1.1) AS scored_avg,
         COALESCE(AVG(ft_home_goals)::numeric(10,3), 1.5) AS conceded_avg,
         COUNT(*) FILTER (WHERE ft_result = 'A')::int AS wins,
         COUNT(*) FILTER (WHERE ft_result = 'D')::int AS draws,
         COUNT(*) FILTER (WHERE ft_result = 'H')::int AS losses
       FROM raw_matches
       WHERE away_team = $1`,
      [awayTeam]
    );
    const awayStats = awayStatsRes.rows[0] || { matches: 1, scored_avg: 1.1, conceded_avg: 1.5, wins: 0, draws: 0, losses: 0 };

    // 4. Head-to-head record (specific to homeTeam at home vs awayTeam)
    const h2hRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ft_result = 'H')::int AS home_wins,
         COUNT(*) FILTER (WHERE ft_result = 'D')::int AS draws,
         COUNT(*) FILTER (WHERE ft_result = 'A')::int AS away_wins,
         COALESCE(AVG(ft_home_goals)::numeric(10,2), 1.5) AS h_goals,
         COALESCE(AVG(ft_away_goals)::numeric(10,2), 1.0) AS a_goals
       FROM raw_matches
       WHERE home_team = $1 AND away_team = $2`,
      [homeTeam, awayTeam]
    );
    const h2h = h2hRes.rows[0];

    // 5. Recent 5 matches form for both teams
    const recentHomeRes = await pool.query(
      `SELECT match_date::text AS match_date, home_team, away_team, ft_home_goals, ft_away_goals, ft_result
       FROM raw_matches
       WHERE home_team = $1 OR away_team = $1
       ORDER BY match_date DESC
       LIMIT 5`,
      [homeTeam]
    );

    const recentAwayRes = await pool.query(
      `SELECT match_date::text AS match_date, home_team, away_team, ft_home_goals, ft_away_goals, ft_result
       FROM raw_matches
       WHERE home_team = $1 OR away_team = $1
       ORDER BY match_date DESC
       LIMIT 5`,
      [awayTeam]
    );

    function calcFormPoints(rows: typeof recentHomeRes.rows, team: string) {
      return rows.map((r) => {
        const isHome = r.home_team === team;
        const gf = isHome ? r.ft_home_goals : r.ft_away_goals;
        const ga = isHome ? r.ft_away_goals : r.ft_home_goals;
        let outcome = "D";
        let pts = 1;
        if (gf > ga) {
          outcome = "W";
          pts = 3;
        } else if (gf < ga) {
          outcome = "L";
          pts = 0;
        }
        return { outcome, pts, gf, ga };
      });
    }

    const homeFormList = calcFormPoints(recentHomeRes.rows, homeTeam);
    const awayFormList = calcFormPoints(recentAwayRes.rows, awayTeam);

    const homeFormPts = homeFormList.reduce((acc, curr) => acc + curr.pts, 0);
    const awayFormPts = awayFormList.reduce((acc, curr) => acc + curr.pts, 0);

    // Form multiplier centered around 1.0 (range ~0.85 to 1.15)
    const homeFormFactor = 0.85 + (homeFormPts / 15) * 0.3;
    const awayFormFactor = 0.85 + (awayFormPts / 15) * 0.3;

    // Relative attack and defense ratings
    const homeAttack = Number(homeStats.scored_avg) / leagueAvgHome;
    const homeDefense = Number(homeStats.conceded_avg) / leagueAvgAway;

    const awayAttack = Number(awayStats.scored_avg) / leagueAvgAway;
    const awayDefense = Number(awayStats.conceded_avg) / leagueAvgHome;

    // Expected goals lambda
    let lambdaHome = Math.max(0.4, leagueAvgHome * homeAttack * awayDefense * homeFormFactor);
    let lambdaAway = Math.max(0.3, leagueAvgAway * awayAttack * homeDefense * awayFormFactor);

    // Blend slightly with H2H if we have sufficient samples (>= 5 matches)
    if (h2h.total >= 5) {
      lambdaHome = lambdaHome * 0.75 + Number(h2h.h_goals) * 0.25;
      lambdaAway = lambdaAway * 0.75 + Number(h2h.a_goals) * 0.25;
    }

    // Calculate score probability matrix (0-6 goals each)
    let homeWinProb = 0;
    let drawProb = 0;
    let awayWinProb = 0;
    const scoreMatrix: { score: string; homeGoals: number; awayGoals: number; prob: number }[] = [];

    let totalProbSum = 0;

    for (let h = 0; h <= 6; h++) {
      for (let a = 0; a <= 6; a++) {
        const prob = poisson(h, lambdaHome) * poisson(a, lambdaAway);
        totalProbSum += prob;

        scoreMatrix.push({
          score: `${h} - ${a}`,
          homeGoals: h,
          awayGoals: a,
          prob,
        });

        if (h > a) homeWinProb += prob;
        else if (h === a) drawProb += prob;
        else awayWinProb += prob;
      }
    }

    // Normalize probabilities to 100%
    const normFactor = totalProbSum > 0 ? 100 / totalProbSum : 1;
    const finalHomeProb = Number((homeWinProb * normFactor).toFixed(1));
    const finalDrawProb = Number((drawProb * normFactor).toFixed(1));
    const finalAwayProb = Number((awayWinProb * normFactor).toFixed(1));

    // Sort most likely scorelines
    const sortedScores = scoreMatrix
      .map((s) => ({ ...s, probPct: Number((s.prob * normFactor).toFixed(1)) }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 6);

    const mostLikelyScore = sortedScores[0];

    // Predictive insights
    const insights: string[] = [];
    if (finalHomeProb > 55) {
      insights.push(`${homeTeam} is a strong home favorite with an attack rating of ${(homeAttack * 100).toFixed(0)}%.`);
    } else if (finalAwayProb > 45) {
      insights.push(`${awayTeam} enters with strong away credentials against ${homeTeam}.`);
    } else {
      insights.push(`This match is closely contested with a high draw probability of ${finalDrawProb}%.`);
    }

    if (lambdaHome + lambdaAway > 2.8) {
      insights.push(`High expected goals (${(lambdaHome + lambdaAway).toFixed(2)}) indicates an open, high-scoring game.`);
    } else {
      insights.push(`Tight defensive match predicted with expected total goals at ${(lambdaHome + lambdaAway).toFixed(2)}.`);
    }

    if (h2h.total > 0) {
      insights.push(`In ${h2h.total} previous meetings at ${homeTeam}'s ground: ${homeTeam} won ${h2h.home_wins}, ${awayTeam} won ${h2h.away_wins}, and ${h2h.draws} were draws.`);
    }

    return NextResponse.json({
      homeTeam,
      awayTeam,
      probabilities: {
        homeWin: finalHomeProb,
        draw: finalDrawProb,
        awayWin: finalAwayProb,
      },
      expectedGoals: {
        homeXG: Number(lambdaHome.toFixed(2)),
        awayXG: Number(lambdaAway.toFixed(2)),
        totalXG: Number((lambdaHome + lambdaAway).toFixed(2)),
      },
      predictedScore: {
        score: mostLikelyScore ? mostLikelyScore.score : "1 - 1",
        homeGoals: mostLikelyScore ? mostLikelyScore.homeGoals : 1,
        awayGoals: mostLikelyScore ? mostLikelyScore.awayGoals : 1,
        probability: mostLikelyScore ? mostLikelyScore.probPct : 15.0,
      },
      likelyScores: sortedScores,
      ratings: {
        homeAttack: Number((homeAttack * 100).toFixed(0)),
        homeDefense: Number((homeDefense * 100).toFixed(0)),
        awayAttack: Number((awayAttack * 100).toFixed(0)),
        awayDefense: Number((awayDefense * 100).toFixed(0)),
        homeFormPoints: homeFormPts,
        awayFormPoints: awayFormPts,
      },
      form: {
        home: homeFormList.map((f) => f.outcome),
        away: awayFormList.map((f) => f.outcome),
      },
      headToHeadAtVenue: {
        matches: h2h.total,
        homeWins: h2h.home_wins,
        draws: h2h.draws,
        awayWins: h2h.away_wins,
      },
      insights,
    });
  } catch (error) {
    console.error("Predict API error:", error);
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}

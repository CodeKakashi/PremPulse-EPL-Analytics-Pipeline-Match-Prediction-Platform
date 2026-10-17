"use client";

import { useState, useEffect } from "react";

interface CompareData {
  teamA: string;
  teamB: string;
  totalMatches: number;
  record: {
    teamAWins: number;
    teamBWins: number;
    draws: number;
    teamAWinPct: number;
    teamBWinPct: number;
    drawPct: number;
  };
  goals: {
    teamAGoals: number;
    teamBGoals: number;
    teamAAvg: number;
    teamBAvg: number;
    totalGoals: number;
    avgMatchGoals: number;
  };
  statsAvg: {
    teamAShots: number;
    teamBShots: number;
    teamASOT: number;
    teamBSOT: number;
    teamACorners: number;
    teamBCorners: number;
    teamAFouls: number;
    teamBFouls: number;
    teamAYellow: number;
    teamBYellow: number;
    teamARed: number;
    teamBRed: number;
  };
  homeAdvantage: {
    teamAAtHome: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };
    teamBAtHome: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };
  };
  biggestWins: {
    teamA: { diff: number; score: string; date: string; season: string } | null;
    teamB: { diff: number; score: string; date: string; season: string } | null;
  };
  formA: { date: string; isHome: boolean; opponent: string; teamGoals: number; oppGoals: number; outcome: string }[];
  formB: { date: string; isHome: boolean; opponent: string; teamGoals: number; oppGoals: number; outcome: string }[];
  recentMatches: {
    id: number;
    season: string;
    match_date: string;
    home_team: string;
    away_team: string;
    ft_home_goals: number;
    ft_away_goals: number;
    ft_result: string;
    ht_home_goals: number;
    ht_away_goals: number;
    home_shots: number;
    away_shots: number;
    home_shots_on_target: number;
    away_shots_on_target: number;
  }[];
}

interface CompareTeamsTabProps {
  teamsList: string[];
}

export default function CompareTeamsTab({ teamsList }: CompareTeamsTabProps) {
  const [teamA, setTeamA] = useState("Arsenal");
  const [teamB, setTeamB] = useState("Chelsea");
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);

  const rivalries = [
    { name: "North London Derby", a: "Arsenal", b: "Tottenham" },
    { name: "Manchester Derby", a: "Man City", b: "Man United" },
    { name: "North-West Rivalry", a: "Liverpool", b: "Man United" },
    { name: "Merseyside Derby", a: "Liverpool", b: "Everton" },
    { name: "London Clash", a: "Arsenal", b: "Chelsea" },
  ];

  const fetchComparison = async (tA: string, tB: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?teamA=${encodeURIComponent(tA)}&teamB=${encodeURIComponent(tB)}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load comparison", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison(teamA, teamB);
  }, [teamA, teamB]);

  const handleSwap = () => {
    const temp = teamA;
    setTeamA(teamB);
    setTeamB(temp);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Selection & Derby Presets Bar ───────────────────── */}
      <section className="glass-card p-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-5">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            {/* Team A Dropdown */}
            <div className="w-full sm:w-1/2">
              <label className="block text-xs uppercase tracking-wider text-accent-emerald font-semibold mb-1.5">
                Team 1
              </label>
              <select
                id="select-team-a"
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-accent-emerald transition-colors"
              >
                {teamsList.map((t) => (
                  <option key={t} value={t} disabled={t === teamB}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              title="Swap Teams"
              className="mt-5 p-2.5 rounded-xl glass-card hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            {/* Team B Dropdown */}
            <div className="w-full sm:w-1/2">
              <label className="block text-xs uppercase tracking-wider text-accent-blue font-semibold mb-1.5">
                Team 2
              </label>
              <select
                id="select-team-b"
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-accent-blue transition-colors"
              >
                {teamsList.map((t) => (
                  <option key={t} value={t} disabled={t === teamA}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rivalry Presets */}
        <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-white/40 whitespace-nowrap">Classic Derbies:</span>
          {rivalries.map((r) => (
            <button
              key={r.name}
              onClick={() => {
                setTeamA(r.a);
                setTeamB(r.b);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white whitespace-nowrap border border-white/[0.06] transition-colors cursor-pointer"
            >
              {r.name}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="w-8 h-8 border-2 border-accent-emerald/30 border-t-accent-emerald rounded-full animate-spin mb-4" />
          <p className="text-sm">Calculating head-to-head metrics...</p>
        </div>
      ) : data ? (
        <>
          {/* ── Matchup Banner ───────────────────────────────── */}
          <section className="glass-card p-6 lg:p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-center md:text-left">
              {/* Team A Display */}
              <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-emerald/30 to-accent-emerald/5 border border-accent-emerald/40 flex items-center justify-center text-2xl font-black text-accent-emerald shadow-lg shadow-accent-emerald/10">
                  {data.teamA.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
                    {data.teamA}
                  </h2>
                  <p className="text-xs text-white/40">
                    {data.record.teamAWins} Wins ({data.record.teamAWinPct}%)
                  </p>
                </div>
              </div>

              {/* Center VS & Total Matches */}
              <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">
                  Head-to-Head
                </span>
                <span className="text-3xl font-black font-mono text-white">
                  {data.record.teamAWins} - {data.record.draws} - {data.record.teamBWins}
                </span>
                <span className="text-[11px] font-mono text-white/40 mt-1">
                  {data.totalMatches} Matches Played
                </span>
              </div>

              {/* Team B Display */}
              <div className="flex-1 flex flex-col md:flex-row-reverse items-center gap-4 text-center md:text-right">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue/30 to-accent-blue/5 border border-accent-blue/40 flex items-center justify-center text-2xl font-black text-accent-blue shadow-lg shadow-accent-blue/10">
                  {data.teamB.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
                    {data.teamB}
                  </h2>
                  <p className="text-xs text-white/40">
                    {data.record.teamBWins} Wins ({data.record.teamBWinPct}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented Win Rate Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/5">
                <div
                  style={{ width: `${data.record.teamAWinPct}%` }}
                  className="bg-accent-emerald transition-all duration-700"
                  title={`${data.teamA}: ${data.record.teamAWinPct}%`}
                />
                <div
                  style={{ width: `${data.record.drawPct}%` }}
                  className="bg-accent-amber/70 transition-all duration-700"
                  title={`Draws: ${data.record.drawPct}%`}
                />
                <div
                  style={{ width: `${data.record.teamBWinPct}%` }}
                  className="bg-accent-blue transition-all duration-700"
                  title={`${data.teamB}: ${data.record.teamBWinPct}%`}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-white/60 px-1">
                <span className="text-accent-emerald font-semibold">
                  {data.teamA} {data.record.teamAWinPct}%
                </span>
                <span className="text-accent-amber font-semibold">
                  Draws {data.record.drawPct}%
                </span>
                <span className="text-accent-blue font-semibold">
                  {data.teamB} {data.record.teamBWinPct}%
                </span>
              </div>
            </div>
          </section>

          {/* ── Comparative Head-to-Head Stats ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stat comparison meters */}
            <section className="glass-card p-6">
              <h3 className="text-base font-semibold text-white/90 mb-1">
                Comparative Match Averages
              </h3>
              <p className="text-xs text-white/40 mb-6">
                Average performance in head-to-head fixtures
              </p>

              <div className="space-y-4">
                {[
                  { label: "Goals Per Match", a: data.goals.teamAAvg, b: data.goals.teamBAvg },
                  { label: "Shots Per Match", a: data.statsAvg.teamAShots, b: data.statsAvg.teamBShots },
                  { label: "Shots on Target", a: data.statsAvg.teamASOT, b: data.statsAvg.teamBSOT },
                  { label: "Corners Per Match", a: data.statsAvg.teamACorners, b: data.statsAvg.teamBCorners },
                  { label: "Fouls Per Match", a: data.statsAvg.teamAFouls, b: data.statsAvg.teamBFouls },
                  { label: "Yellow Cards", a: data.statsAvg.teamAYellow, b: data.statsAvg.teamBYellow },
                ].map((item) => {
                  const maxVal = Math.max(item.a, item.b, 0.1);
                  const aPct = (item.a / (item.a + item.b || 1)) * 100;
                  const bPct = (item.b / (item.a + item.b || 1)) * 100;

                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-accent-emerald font-semibold">{item.a}</span>
                        <span className="text-white/50">{item.label}</span>
                        <span className="text-accent-blue font-semibold">{item.b}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${aPct}%` }}
                          className="bg-accent-emerald/80"
                        />
                        <div
                          style={{ width: `${bPct}%` }}
                          className="bg-accent-blue/80"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Venue Splits & Biggest Wins */}
            <section className="space-y-6">
              {/* Venue splits */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-white/90 mb-1">
                  Home Ground Dominance
                </h3>
                <p className="text-xs text-white/40 mb-4">
                  Breakdown by fixture venue
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team A at Home */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xs font-semibold text-accent-emerald mb-1">
                      {data.teamA} at Home
                    </p>
                    <p className="text-xl font-bold font-mono text-white mb-2">
                      {data.homeAdvantage.teamAAtHome.wins}W - {data.homeAdvantage.teamAAtHome.draws}D - {data.homeAdvantage.teamAAtHome.losses}L
                    </p>
                    <p className="text-xs text-white/40">
                      Goals: {data.homeAdvantage.teamAAtHome.goalsFor} Scored / {data.homeAdvantage.teamAAtHome.goalsAgainst} Conceded
                    </p>
                  </div>

                  {/* Team B at Home */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xs font-semibold text-accent-blue mb-1">
                      {data.teamB} at Home
                    </p>
                    <p className="text-xl font-bold font-mono text-white mb-2">
                      {data.homeAdvantage.teamBAtHome.wins}W - {data.homeAdvantage.teamBAtHome.draws}D - {data.homeAdvantage.teamBAtHome.losses}L
                    </p>
                    <p className="text-xs text-white/40">
                      Goals: {data.homeAdvantage.teamBAtHome.goalsFor} Scored / {data.homeAdvantage.teamBAtHome.goalsAgainst} Conceded
                    </p>
                  </div>
                </div>
              </div>

              {/* Biggest Wins Callout */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-white/90 mb-4">
                  Record Victories
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-accent-emerald/5 border border-accent-emerald/20">
                    <p className="text-[11px] text-accent-emerald font-semibold uppercase mb-1">
                      Biggest {data.teamA} Win
                    </p>
                    <p className="text-lg font-bold text-white mb-0.5">
                      {data.biggestWins.teamA ? data.biggestWins.teamA.score : "N/A"}
                    </p>
                    <p className="text-white/40">
                      {data.biggestWins.teamA ? `${data.biggestWins.teamA.date} (${data.biggestWins.teamA.season})` : "—"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
                    <p className="text-[11px] text-accent-blue font-semibold uppercase mb-1">
                      Biggest {data.teamB} Win
                    </p>
                    <p className="text-lg font-bold text-white mb-0.5">
                      {data.biggestWins.teamB ? data.biggestWins.teamB.score : "N/A"}
                    </p>
                    <p className="text-white/40">
                      {data.biggestWins.teamB ? `${data.biggestWins.teamB.date} (${data.biggestWins.teamB.season})` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Recent Head-to-Head Encounters Table ────────── */}
          <section className="glass-card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-1">
              Recent Head-to-Head Clashes
            </h3>
            <p className="text-xs text-white/40 mb-4">
              Match history ordered from newest to oldest
            </p>

            {data.recentMatches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase tracking-wider">
                      <th className="pb-3 pl-2">Date</th>
                      <th className="pb-3">Season</th>
                      <th className="pb-3 text-right">Home Team</th>
                      <th className="pb-3 text-center">Score</th>
                      <th className="pb-3">Away Team</th>
                      <th className="pb-3 text-center">HT</th>
                      <th className="pb-3 text-right pr-2">Shots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {data.recentMatches.map((m) => {
                      const isAWin =
                        (m.home_team === data.teamA && m.ft_result === "H") ||
                        (m.away_team === data.teamA && m.ft_result === "A");
                      const isBWin =
                        (m.home_team === data.teamB && m.ft_result === "H") ||
                        (m.away_team === data.teamB && m.ft_result === "A");

                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pl-2 font-mono text-xs text-white/60">
                            {m.match_date}
                          </td>
                          <td className="py-3 font-mono text-xs text-white/40">
                            {m.season}
                          </td>
                          <td className="py-3 text-right font-medium text-white/90">
                            {m.home_team}
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs ${
                                isAWin
                                  ? "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30"
                                  : isBWin
                                  ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30"
                                  : "bg-white/10 text-white/80"
                              }`}
                            >
                              {m.ft_home_goals} - {m.ft_away_goals}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-white/90">
                            {m.away_team}
                          </td>
                          <td className="py-3 text-center font-mono text-xs text-white/40">
                            {m.ht_home_goals}-{m.ht_away_goals}
                          </td>
                          <td className="py-3 text-right pr-2 font-mono text-xs text-white/50">
                            {m.home_shots || 0} - {m.away_shots || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-white/30">No direct matches found between these teams.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

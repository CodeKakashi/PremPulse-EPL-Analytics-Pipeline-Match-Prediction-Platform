"use client";

import { useState, useEffect } from "react";

interface PredictData {
  homeTeam: string;
  awayTeam: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  expectedGoals: {
    homeXG: number;
    awayXG: number;
    totalXG: number;
  };
  predictedScore: {
    score: string;
    homeGoals: number;
    awayGoals: number;
    probability: number;
  };
  likelyScores: {
    score: string;
    homeGoals: number;
    awayGoals: number;
    probPct: number;
  }[];
  ratings: {
    homeAttack: number;
    homeDefense: number;
    awayAttack: number;
    awayDefense: number;
    homeFormPoints: number;
    awayFormPoints: number;
  };
  form: {
    home: string[];
    away: string[];
  };
  headToHeadAtVenue: {
    matches: number;
    homeWins: number;
    draws: number;
    awayWins: number;
  };
  insights: string[];
}

interface MatchPredictorTabProps {
  teamsList: string[];
}

export default function MatchPredictorTab({ teamsList }: MatchPredictorTabProps) {
  const [homeTeam, setHomeTeam] = useState("Arsenal");
  const [awayTeam, setAwayTeam] = useState("Chelsea");
  const [data, setData] = useState<PredictData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrediction = async (h: string, a: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predict?homeTeam=${encodeURIComponent(h)}&awayTeam=${encodeURIComponent(a)}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to calculate prediction", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(homeTeam, awayTeam);
  }, [homeTeam, awayTeam]);

  const handleSwap = () => {
    const temp = homeTeam;
    setHomeTeam(awayTeam);
    setAwayTeam(temp);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Match Setup Section ─────────────────────────────── */}
      <section className="glass-card p-6">
        <h2 className="text-base font-semibold text-white/90 mb-1">
          Predict Match Outcome
        </h2>
        <p className="text-xs text-white/40 mb-6">
          Poisson expected goals model trained on 9,300+ historical EPL fixtures with form weighting
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Home Team */}
          <div className="w-full sm:w-1/2">
            <label className="block text-xs uppercase tracking-wider text-accent-emerald font-semibold mb-1.5 flex items-center gap-1.5">
              <span>🏠</span> Home Team
            </label>
            <select
              id="select-predict-home"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-accent-emerald transition-colors"
            >
              {teamsList.map((t) => (
                <option key={t} value={t} disabled={t === awayTeam}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            title="Swap Home/Away"
            className="mt-5 p-2.5 rounded-xl glass-card hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          {/* Away Team */}
          <div className="w-full sm:w-1/2">
            <label className="block text-xs uppercase tracking-wider text-accent-blue font-semibold mb-1.5 flex items-center gap-1.5">
              <span>✈️</span> Away Team
            </label>
            <select
              id="select-predict-away"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-accent-blue transition-colors"
            >
              {teamsList.map((t) => (
                <option key={t} value={t} disabled={t === homeTeam}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="w-8 h-8 border-2 border-accent-emerald/30 border-t-accent-emerald rounded-full animate-spin mb-4" />
          <p className="text-sm">Simulating match probabilities...</p>
        </div>
      ) : data ? (
        <>
          {/* ── Main Win Probability Display ─────────────────── */}
          <section className="glass-card p-6 lg:p-8 relative overflow-hidden">
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                Simulated Match Outcome
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {data.homeTeam} <span className="text-white/30 font-light">vs</span> {data.awayTeam}
              </h2>
            </div>

            {/* 3 Outcome Probability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Home Win */}
              <div className="p-5 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/30 text-center relative overflow-hidden shadow-lg shadow-accent-emerald/5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-emerald mb-1">
                  Home Win
                </p>
                <p className="text-4xl font-black font-mono text-white mb-2">
                  {data.probabilities.homeWin}%
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px] text-white/60">
                  <span>xG: {data.expectedGoals.homeXG}</span>
                </div>
              </div>

              {/* Draw */}
              <div className="p-5 rounded-2xl bg-accent-amber/10 border border-accent-amber/30 text-center relative overflow-hidden shadow-lg shadow-accent-amber/5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-amber mb-1">
                  Draw
                </p>
                <p className="text-4xl font-black font-mono text-white mb-2">
                  {data.probabilities.draw}%
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px] text-white/60">
                  <span>Even Match Factor</span>
                </div>
              </div>

              {/* Away Win */}
              <div className="p-5 rounded-2xl bg-accent-blue/10 border border-accent-blue/30 text-center relative overflow-hidden shadow-lg shadow-accent-blue/5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue mb-1">
                  Away Win
                </p>
                <p className="text-4xl font-black font-mono text-white mb-2">
                  {data.probabilities.awayWin}%
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px] text-white/60">
                  <span>xG: {data.expectedGoals.awayXG}</span>
                </div>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/5">
                <div
                  style={{ width: `${data.probabilities.homeWin}%` }}
                  className="bg-accent-emerald transition-all duration-700"
                />
                <div
                  style={{ width: `${data.probabilities.draw}%` }}
                  className="bg-accent-amber transition-all duration-700"
                />
                <div
                  style={{ width: `${data.probabilities.awayWin}%` }}
                  className="bg-accent-blue transition-all duration-700"
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-white/60 px-1">
                <span className="text-accent-emerald font-semibold">{data.homeTeam}</span>
                <span className="text-accent-amber font-semibold">Draw</span>
                <span className="text-accent-blue font-semibold">{data.awayTeam}</span>
              </div>
            </div>

            {/* Predicted Score Banner */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-violet/20 border border-accent-violet/40 flex items-center justify-center text-lg">
                  ⚽
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase font-semibold">
                    Most Probable Scoreline
                  </p>
                  <p className="text-xl font-bold font-mono text-white">
                    {data.homeTeam} {data.predictedScore.score} {data.awayTeam}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-mono font-medium bg-accent-violet/15 text-accent-violet border border-accent-violet/30">
                  {data.predictedScore.probability}% model confidence
                </span>
              </div>
            </div>
          </section>

          {/* ── Expected Goals & Top Scorelines ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Scorelines */}
            <section className="glass-card p-6">
              <h3 className="text-base font-semibold text-white/90 mb-1">
                Top Probable Scorelines
              </h3>
              <p className="text-xs text-white/40 mb-4">
                Monte Carlo Poisson frequency distribution
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.likelyScores.map((s, idx) => (
                  <div
                    key={s.score}
                    className={`p-3 rounded-xl border transition-all ${
                      idx === 0
                        ? "bg-accent-violet/15 border-accent-violet/40 shadow-sm shadow-accent-violet/10"
                        : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="text-lg font-bold font-mono text-white text-center">
                      {s.score}
                    </p>
                    <p className="text-[11px] font-mono text-center text-white/50 mt-0.5">
                      {s.probPct}%
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Team Form Guide & Ratings */}
            <section className="glass-card p-6">
              <h3 className="text-base font-semibold text-white/90 mb-1">
                Recent Form & Attack Ratings
              </h3>
              <p className="text-xs text-white/40 mb-4">
                Last 5 fixtures and normalized offensive index
              </p>

              <div className="space-y-4">
                {/* Home team form */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-accent-emerald">
                      {data.homeTeam} (Home)
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      Attack Rating: {data.ratings.homeAttack}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/40 mr-2">Form:</span>
                    {data.form.home.map((outcome, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                          outcome === "W"
                            ? "bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40"
                            : outcome === "D"
                            ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/40"
                            : "bg-accent-rose/20 text-accent-rose border border-accent-rose/40"
                        }`}
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Away team form */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-accent-blue">
                      {data.awayTeam} (Away)
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      Attack Rating: {data.ratings.awayAttack}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/40 mr-2">Form:</span>
                    {data.form.away.map((outcome, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                          outcome === "W"
                            ? "bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40"
                            : outcome === "D"
                            ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/40"
                            : "bg-accent-rose/20 text-accent-rose border border-accent-rose/40"
                        }`}
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Model Insights & Analytical Notes ─────────────── */}
          <section className="glass-card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-3 flex items-center gap-2">
              <span>🧠</span> Model Reasoning & Tactical Factors
            </h3>
            <div className="space-y-2.5">
              {data.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-white/80"
                >
                  <span className="text-accent-teal mt-0.5">▸</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

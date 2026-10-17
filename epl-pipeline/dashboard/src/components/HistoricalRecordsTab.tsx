"use client";

import { useState, useEffect, useCallback } from "react";

interface MatchRecord {
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
  ht_result: string;
  home_shots: number;
  away_shots: number;
  home_shots_on_target: number;
  away_shots_on_target: number;
  home_corners: number;
  away_corners: number;
  home_fouls: number;
  away_fouls: number;
  home_yellow_cards: number;
  away_yellow_cards: number;
  home_red_cards: number;
  away_red_cards: number;
  source: string;
}

interface HistoricalData {
  matches: MatchRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalGoals: number;
    avgGoals: number;
    homeWins: number;
    draws: number;
    awayWins: number;
  };
}

interface HistoricalRecordsTabProps {
  teamsList: string[];
  seasonsList: string[];
}

export default function HistoricalRecordsTab({
  teamsList,
  seasonsList,
}: HistoricalRecordsTabProps) {
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState("all");
  const [team, setTeam] = useState("all");
  const [result, setResult] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        season,
        team,
        result,
        sort,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/historical?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load historical records", err);
    } finally {
      setLoading(false);
    }
  }, [search, season, team, result, sort, page, limit]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Filters & Search Control Bar ─────────────────────── */}
      <section className="glass-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {/* Search by team name */}
          <div className="lg:col-span-1">
            <label className="block text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
              Search Team
            </label>
            <input
              id="search-historical-input"
              type="text"
              placeholder="e.g. Arsenal, Liverpool..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-accent-emerald transition-colors"
            />
          </div>

          {/* Season dropdown */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
              Season
            </label>
            <select
              id="filter-season"
              value={season}
              onChange={(e) => handleFilterChange(setSeason, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/10 text-white text-xs focus:outline-none focus:border-accent-emerald transition-colors"
            >
              <option value="all">All Seasons</option>
              {seasonsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Team dropdown */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
              Specific Club
            </label>
            <select
              id="filter-team"
              value={team}
              onChange={(e) => handleFilterChange(setTeam, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/10 text-white text-xs focus:outline-none focus:border-accent-emerald transition-colors"
            >
              <option value="all">All Teams</option>
              {teamsList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Result outcome dropdown */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
              Outcome
            </label>
            <select
              id="filter-result"
              value={result}
              onChange={(e) => handleFilterChange(setResult, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/10 text-white text-xs focus:outline-none focus:border-accent-emerald transition-colors"
            >
              <option value="all">All Results</option>
              <option value="H">Home Win (H)</option>
              <option value="D">Draw (D)</option>
              <option value="A">Away Win (A)</option>
            </select>
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
              Sort By
            </label>
            <select
              id="filter-sort"
              value={sort}
              onChange={(e) => handleFilterChange(setSort, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/10 text-white text-xs focus:outline-none focus:border-accent-emerald transition-colors"
            >
              <option value="date_desc">Newest Fixtures First</option>
              <option value="date_asc">Oldest Fixtures First</option>
              <option value="goals_desc">Highest Goals Match</option>
              <option value="shots_desc">Most Total Shots</option>
            </select>
          </div>
        </div>

        {/* Filter summary strip */}
        {data && (
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-white/60">
            <div className="flex items-center gap-4">
              <span>
                Matches: <strong className="text-white">{data.pagination.total.toLocaleString()}</strong>
              </span>
              <span>
                Total Goals: <strong className="text-accent-emerald">{data.summary.totalGoals.toLocaleString()}</strong>
              </span>
              <span>
                Avg Goals: <strong className="text-accent-teal">{data.summary.avgGoals}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent-emerald">Home: {data.summary.homeWins}</span>
              <span className="text-accent-amber">Draw: {data.summary.draws}</span>
              <span className="text-accent-blue">Away: {data.summary.awayWins}</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Match Records List ──────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="w-8 h-8 border-2 border-accent-emerald/30 border-t-accent-emerald rounded-full animate-spin mb-4" />
          <p className="text-sm">Fetching match archives...</p>
        </div>
      ) : data && data.matches.length > 0 ? (
        <div className="space-y-3">
          {data.matches.map((m) => {
            const isHomeWin = m.ft_result === "H";
            const isAwayWin = m.ft_result === "A";

            return (
              <div
                key={m.id}
                className="glass-card p-4 sm:p-5 hover:border-white/15 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Date, Season, Source */}
                <div className="flex items-center gap-3 w-full md:w-48">
                  <div className="text-left font-mono">
                    <p className="text-xs font-semibold text-white/90">{m.match_date}</p>
                    <p className="text-[11px] text-white/40">{m.season}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ml-auto md:ml-0 ${
                      m.source === "csv"
                        ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                        : "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                    }`}
                  >
                    {m.source}
                  </span>
                </div>

                {/* Center: Teams & Score */}
                <div className="flex-1 flex items-center justify-center gap-4 w-full md:w-auto">
                  <div className="w-2/5 text-right font-medium text-sm sm:text-base text-white/90">
                    <span className={isHomeWin ? "text-accent-emerald font-bold" : ""}>
                      {m.home_team}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center min-w-[70px]">
                    <span className="text-base sm:text-lg font-black font-mono text-white">
                      {m.ft_home_goals} - {m.ft_away_goals}
                    </span>
                    <span className="block text-[10px] font-mono text-white/40">
                      HT: {m.ht_home_goals}-{m.ht_away_goals}
                    </span>
                  </div>

                  <div className="w-2/5 text-left font-medium text-sm sm:text-base text-white/90">
                    <span className={isAwayWin ? "text-accent-blue font-bold" : ""}>
                      {m.away_team}
                    </span>
                  </div>
                </div>

                {/* Right: In-depth match stats */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-64 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04] text-xs font-mono text-white/50">
                  <div title="Shots (Target/Total)">
                    <span className="text-white/30 text-[10px] block">Shots</span>
                    <span>
                      {m.home_shots_on_target || 0}/{m.home_shots || 0} - {m.away_shots_on_target || 0}/{m.away_shots || 0}
                    </span>
                  </div>
                  <div title="Corners">
                    <span className="text-white/30 text-[10px] block">Corners</span>
                    <span>
                      {m.home_corners || 0} - {m.away_corners || 0}
                    </span>
                  </div>
                  <div title="Yellow Cards">
                    <span className="text-white/30 text-[10px] block">Cards</span>
                    <span className="text-accent-amber">
                      {m.home_yellow_cards || 0} - {m.away_yellow_cards || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Pagination Controls ─────────────────────────── */}
          <div className="flex items-center justify-between pt-4 pb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl glass-card text-xs font-medium text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              ← Previous Page
            </button>

            <span className="text-xs font-mono text-white/50">
              Page <strong className="text-white">{page}</strong> of{" "}
              <strong className="text-white">{data.pagination.totalPages.toLocaleString()}</strong>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages}
              className="px-4 py-2 rounded-xl glass-card text-xs font-medium text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Next Page →
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-white/40">
          <p className="text-base font-semibold mb-1">No matches found</p>
          <p className="text-xs">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import NavigationTabs, { TabId } from "@/components/NavigationTabs";
import PipelineTab from "@/components/PipelineTab";
import CompareTeamsTab from "@/components/CompareTeamsTab";
import FindingsTab from "@/components/FindingsTab";
import MatchPredictorTab from "@/components/MatchPredictorTab";
import HistoricalRecordsTab from "@/components/HistoricalRecordsTab";

interface QualityRow {
  column_name: string;
  total_rows: number;
  null_count: number;
  completeness: number;
}

interface IngestionEvent {
  ingested_at: string;
  source: string;
  row_count: number;
}

interface TableStatusItem {
  name: string;
  exists: boolean;
  rowCount: number;
}

interface MetricsData {
  overview: {
    totalRawRows: number;
    totalStagedRows: number;
    totalFeatureRows: number;
    latestIngestion: string | null;
    uniqueTeams: number;
    uniqueSeasons: number;
    sourceBreakdown: { source: string; count: number }[];
  };
  quality: QualityRow[];
  recentIngestions: IngestionEvent[];
  tableStatus: TableStatusItem[];
  fetchedAt: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("compare");
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [seasonsList, setSeasonsList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch pipeline metrics
  const fetchMetrics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MetricsData = await res.json();
      setMetrics(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch metrics");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch teams and seasons once
  const fetchTeamsAndSeasons = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const json = await res.json();
        setTeamsList(json.teams || []);
        setSeasonsList(json.seasons || []);
      }
    } catch (e) {
      console.error("Failed to load teams", e);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchTeamsAndSeasons();
    const interval = setInterval(fetchMetrics, 10_000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchTeamsAndSeasons]);

  const avgCompleteness =
    metrics?.quality && metrics.quality.length > 0
      ? Number(
          (
            metrics.quality.reduce((s, q) => s + Number(q.completeness), 0) /
            metrics.quality.length
          ).toFixed(1)
        )
      : 100;

  return (
    <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Top Header ─────────────────────────────────────── */}
      <Header
        isConnected={!error && metrics !== null}
        lastFetched={metrics?.fetchedAt ?? null}
        onRefresh={fetchMetrics}
        isRefreshing={isRefreshing}
      />

      {/* Error banner */}
      {error && (
        <div className="glass-card border-accent-rose/30 bg-accent-rose/5 p-4 mb-6">
          <p className="text-sm text-accent-rose font-medium">
            ⚠ Connection Alert: <span className="text-white/60">{error}</span>
          </p>
        </div>
      )}

      {/* ── Tab Navigation ─────────────────────────────────── */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Tab Views ──────────────────────────────────────── */}
      <div className="transition-all duration-300">
        {activeTab === "pipeline" && (
          <PipelineTab metrics={metrics} avgCompleteness={avgCompleteness} />
        )}

        {activeTab === "compare" && (
          <CompareTeamsTab
            teamsList={
              teamsList.length > 0
                ? teamsList
                : [
                    "Arsenal",
                    "Aston Villa",
                    "Chelsea",
                    "Everton",
                    "Liverpool",
                    "Man City",
                    "Man United",
                    "Newcastle",
                    "Tottenham",
                  ]
            }
          />
        )}

        {activeTab === "findings" && <FindingsTab />}

        {activeTab === "predict" && (
          <MatchPredictorTab
            teamsList={
              teamsList.length > 0
                ? teamsList
                : [
                    "Arsenal",
                    "Aston Villa",
                    "Chelsea",
                    "Everton",
                    "Liverpool",
                    "Man City",
                    "Man United",
                    "Newcastle",
                    "Tottenham",
                  ]
            }
          />
        )}

        {activeTab === "historical" && (
          <HistoricalRecordsTab
            teamsList={teamsList}
            seasonsList={seasonsList}
          />
        )}
      </div>
    </main>
  );
}

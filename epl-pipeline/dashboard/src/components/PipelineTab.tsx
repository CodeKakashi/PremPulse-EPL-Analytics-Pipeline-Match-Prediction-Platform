"use client";

import MetricCard from "@/components/MetricCard";
import DataQualityTable from "@/components/DataQualityTable";

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

interface PipelineTabProps {
  metrics: MetricsData | null;
  avgCompleteness: number;
}

export default function PipelineTab({ metrics, avgCompleteness }: PipelineTabProps) {
  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <div className="w-8 h-8 border-2 border-accent-emerald/30 border-t-accent-emerald rounded-full animate-spin mb-4" />
        <p className="text-sm">Connecting to PostgreSQL pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── 1. Top Metrics Grid ──────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
          Pipeline Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Ingested"
            value={metrics.overview.totalRawRows}
            subtitle="raw_matches table"
            glowClass="metric-glow-emerald"
            animationClass="animate-fade-in"
            icon={
              <svg className="w-5 h-5 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6" />
              </svg>
            }
          />
          <MetricCard
            title="Staged Matches"
            value={metrics.overview.totalStagedRows}
            subtitle="stg_matches (dbt view)"
            glowClass="metric-glow-teal"
            animationClass="animate-fade-in-delay"
            icon={
              <svg className="w-5 h-5 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <MetricCard
            title="ML Feature Rows"
            value={metrics.overview.totalFeatureRows}
            subtitle="epl_features (dbt table)"
            glowClass="metric-glow-blue"
            animationClass="animate-fade-in-delay-2"
            icon={
              <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <MetricCard
            title="Completeness"
            value={`${avgCompleteness}%`}
            subtitle="Across all columns"
            glowClass="metric-glow-violet"
            animationClass="animate-fade-in-delay-3"
            icon={
              <svg className="w-5 h-5 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Unique Teams"
            value={metrics.overview.uniqueTeams}
            subtitle="Tracked in dataset"
            glowClass="metric-glow-amber"
            animationClass="animate-fade-in-delay-2"
            icon={
              <svg className="w-5 h-5 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Active Seasons"
            value={metrics.overview.uniqueSeasons}
            subtitle="Historical range"
            glowClass="metric-glow-teal"
            animationClass="animate-fade-in-delay-3"
            icon={
              <svg className="w-5 h-5 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── 2. Data Completeness Gauge ───────────────────────── */}
      <section className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-semibold text-white/90">
              Overall Data Completeness
            </h2>
            <p className="text-xs text-white/40">
              Percentage of non-null values across all monitored columns
            </p>
          </div>
          <span className="text-2xl font-bold font-mono text-accent-emerald">
            {avgCompleteness}%
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              avgCompleteness > 90 ? "progress-fill" : "progress-fill-low"
            }`}
            style={{ width: `${Math.min(avgCompleteness, 100)}%` }}
          />
        </div>
      </section>

      {/* ── 3. Data Quality Table ────────────────────────────── */}
      <section>
        <DataQualityTable data={metrics.quality} />
      </section>

      {/* ── 4. Two-Column Details ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source breakdown */}
        <section className="glass-card p-6">
          <h2 className="text-base font-semibold text-white/90 mb-1">
            Data Sources
          </h2>
          <p className="text-xs text-white/40 mb-4">
            Distribution of ingested match records by origin
          </p>
          {metrics.overview.sourceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {metrics.overview.sourceBreakdown.map((src) => {
                const total = metrics.overview.totalRawRows || 1;
                const pct = ((src.count / total) * 100).toFixed(1);
                return (
                  <div key={src.source} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${src.source === "csv" ? "bg-accent-blue" : "bg-accent-emerald"}`} />
                      <div>
                        <p className="text-sm font-medium text-white/80 uppercase">
                          {src.source}
                        </p>
                        <p className="text-xs text-white/30">
                          {src.source === "csv" ? "Historical dataset seed" : "Real-time mock generator"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold text-white/90">
                        {src.count.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-white/40">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/30">No data ingested yet</p>
          )}
        </section>

        {/* Table status */}
        <section className="glass-card p-6">
          <h2 className="text-base font-semibold text-white/90 mb-1">
            Pipeline Tables
          </h2>
          <p className="text-xs text-white/40 mb-4">
            Current status of PostgreSQL storage & transform layers
          </p>
          <div className="space-y-3">
            {metrics.tableStatus.map((tbl) => (
              <div key={tbl.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <span className={`status-dot ${tbl.exists ? "bg-accent-emerald" : "bg-accent-rose"}`} />
                  <div>
                    <p className="text-sm font-mono font-medium text-white/80">
                      {tbl.name}
                    </p>
                    <p className="text-xs text-white/30">
                      {tbl.name === "raw_matches"
                        ? "Ingestion target (raw)"
                        : tbl.name === "stg_matches"
                        ? "dbt staging view"
                        : "dbt feature table"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-white/90">
                    {tbl.rowCount.toLocaleString()} rows
                  </p>
                  <p className="text-xs text-accent-emerald font-medium">
                    {tbl.exists ? "Operational" : "Not Found"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── 5. Ingestion Timeline ────────────────────────────── */}
      <section className="glass-card p-6">
        <h2 className="text-base font-semibold text-white/90 mb-1">
          Recent Ingestions
        </h2>
        <p className="text-xs text-white/40 mb-4">
          Latest batch insert events from Python ingestion service
        </p>
        {metrics.recentIngestions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3 text-right pr-2">Rows Ingested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {metrics.recentIngestions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pl-2 font-mono text-xs text-white/60">
                      {item.ingested_at}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        item.source === "csv"
                          ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                          : "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                      }`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pr-2 font-mono text-xs text-white/90 font-medium">
                      +{item.row_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/30">No ingestion events yet</p>
        )}
      </section>
    </div>
  );
}

"use client";

interface QualityRow {
  column_name: string;
  total_rows: number;
  null_count: number;
  completeness: number;
}

interface DataQualityTableProps {
  data: QualityRow[];
}

function formatColumnName(col: string): string {
  return col
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getCompletenessColor(pct: number): string {
  if (pct >= 99.5) return "text-accent-emerald";
  if (pct >= 95) return "text-accent-teal";
  if (pct >= 80) return "text-accent-amber";
  return "text-accent-rose";
}

export default function DataQualityTable({ data }: DataQualityTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 animate-fade-in-delay-2 opacity-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
          Data Quality
        </h2>
        <p className="text-sm text-white/30">
          No quality data available. Run the ingestion service first.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in-delay-2 opacity-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Column Data Quality
        </h2>
        <span className="text-[10px] text-white/25 font-mono">
          {data[0]?.total_rows.toLocaleString()} rows analysed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider pb-3 pr-4">
                Column
              </th>
              <th className="text-right text-[11px] font-semibold text-white/30 uppercase tracking-wider pb-3 px-4">
                Nulls
              </th>
              <th className="text-right text-[11px] font-semibold text-white/30 uppercase tracking-wider pb-3 px-4">
                Completeness
              </th>
              <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider pb-3 pl-4 w-48">
                Health
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.column_name}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-white/70">
                    {formatColumnName(row.column_name)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-mono text-xs ${
                      row.null_count === 0
                        ? "text-white/25"
                        : "text-accent-amber"
                    }`}
                  >
                    {row.null_count.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-mono text-xs font-semibold ${getCompletenessColor(
                      row.completeness
                    )}`}
                  >
                    {row.completeness}%
                  </span>
                </td>
                <td className="py-3 pl-4">
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        row.completeness >= 95
                          ? "progress-fill"
                          : "progress-fill-low"
                      }`}
                      style={{ width: `${row.completeness}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

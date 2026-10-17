"use client";

interface HeaderProps {
  isConnected: boolean;
  lastFetched: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({
  isConnected,
  lastFetched,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  return (
    <header className="relative z-10 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Title & Status */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-accent-emerald via-accent-teal to-accent-blue bg-clip-text text-transparent">
                EPL Pipeline
              </span>{" "}
              <span className="text-white/90">Dashboard</span>
            </h1>
          </div>
          <p className="text-sm text-white/40">
            Real-time data quality monitoring for your EPL data engineering
            pipeline
          </p>
        </div>

        {/* Right: Status & Refresh */}
        <div className="flex items-center gap-4">
          {/* Pipeline status */}
          <div className="flex items-center gap-2 glass-card px-4 py-2">
            <span
              className={`status-dot ${
                isConnected ? "bg-accent-emerald" : "bg-accent-rose"
              }`}
            />
            <span className="text-xs font-medium text-white/60">
              {isConnected ? "Pipeline Active" : "Disconnected"}
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="glass-card px-4 py-2 text-xs font-medium text-white/60 hover:text-white/90 
                       transition-all duration-200 flex items-center gap-2 cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin-slow" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          {/* Last fetched */}
          {lastFetched && (
            <span className="text-[10px] text-white/30 font-mono hidden sm:block">
              {new Date(lastFetched).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

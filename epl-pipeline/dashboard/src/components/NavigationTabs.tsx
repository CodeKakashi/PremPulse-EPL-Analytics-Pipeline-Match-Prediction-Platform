"use client";

export type TabId = "pipeline" | "compare" | "findings" | "predict" | "historical";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "pipeline",
    label: "Pipeline & Data Quality",
    icon: "⚡",
    description: "Ingestion health, table status, data quality null checks",
  },
  {
    id: "compare",
    label: "Compare Two Teams",
    icon: "⚔️",
    description: "Head-to-head records, goal statistics, and past clashes",
  },
  {
    id: "findings",
    label: "Findings & Results",
    icon: "📊",
    description: "Empirical insights, home advantage, and all-time leaderboard",
  },
  {
    id: "predict",
    label: "Win Probability Predictor",
    icon: "🔮",
    description: "Poisson xG match simulator and scoreline probabilities",
  },
  {
    id: "historical",
    label: "Historical Records",
    icon: "📜",
    description: "Search, filter, and analyze 9,300+ match reports",
  },
];

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function NavigationTabs({
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  return (
    <nav className="mb-8" aria-label="Dashboard sections">
      <div className="flex flex-wrap gap-2 p-1.5 glass-card rounded-2xl bg-surface-card/60 border-white/5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[150px] sm:min-w-fit flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-accent-emerald/20 via-accent-teal/20 to-accent-blue/20 text-white border border-accent-emerald/40 shadow-lg shadow-accent-emerald/10 font-semibold"
                  : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

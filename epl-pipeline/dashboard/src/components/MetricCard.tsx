"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  glowClass?: string;
  animationClass?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  glowClass = "",
  animationClass = "animate-fade-in",
}: MetricCardProps) {
  return (
    <div
      className={`glass-card p-5 ${glowClass} ${animationClass} opacity-0`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          {title}
        </span>
        <span className="text-white/20">{icon}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-white/95 mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-xs text-white/35 font-medium">{subtitle}</p>
      )}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
  trend?: number;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/18 text-warning-foreground",
    danger: "bg-danger/12 text-danger",
  } as const;

  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  trend > 0 && "bg-success/12 text-success",
                  trend < 0 && "bg-danger/12 text-danger",
                  trend === 0 && "bg-secondary text-muted-foreground",
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="size-3" />
                ) : trend < 0 ? (
                  <TrendingDown className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-110",
            tones[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

interface PageHeaderAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: PageHeaderAction | undefined;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <action.icon className="size-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

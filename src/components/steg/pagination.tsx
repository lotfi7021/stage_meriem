import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, total, perPage, onPageChange, className }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm",
        className,
      )}
    >
      <p className="text-muted-foreground">
        Affichage de <span className="font-medium tabular-nums">{from}</span> à{" "}
        <span className="font-medium tabular-nums">{to}</span> sur{" "}
        <span className="font-medium tabular-nums">{total}</span> résultats
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="grid size-8 place-items-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="grid size-8 place-items-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "grid size-8 place-items-center rounded-md border text-sm font-medium transition-colors",
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:bg-secondary",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="grid size-8 place-items-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="grid size-8 place-items-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

interface PerPageSelectProps {
  value: number;
  onChange: (n: number) => void;
  options?: number[];
}

export function PerPageSelect({ value, onChange, options = [10, 20, 50] }: PerPageSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-input bg-card px-2 py-1.5 text-xs"
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {n} / page
        </option>
      ))}
    </select>
  );
}

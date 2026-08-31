"use client";

import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";

export function NotificationBell() {
  const { data: invoices = [] } = useInvoices();
  const alertes = invoices.filter((i) => i.statut === "en_retard" || i.statut === "impayee").length;

  return (
    <Link
      to="/notifications"
      className="relative grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
    >
      <Bell className="size-4" />
      {alertes > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
          {alertes}
        </span>
      )}
    </Link>
  );
}
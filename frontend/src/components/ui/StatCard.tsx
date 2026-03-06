"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accentColor?: "primary" | "secondary" | "warning" | "danger";
  className?: string;
}

const accentMap = {
  primary: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-primary",
    border: "border-l-primary",
  },
  secondary: {
    bg: "bg-gray-100 dark:bg-slate-700",
    text: "text-gray-600 dark:text-slate-300",
    border: "border-l-gray-400",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-600",
    border: "border-l-amber-500",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-600",
    border: "border-l-red-500",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = "primary",
  className,
}: StatCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className={cn(
        "card-static p-5 border-l-4",
        accent.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-heading font-bold text-gray-900 dark:text-slate-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl", accent.bg)}>
          <Icon size={20} className={accent.text} />
        </div>
      </div>
    </div>
  );
}

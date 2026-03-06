"use client";

import { ShieldCheck, Clock, Lock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustTier = "high" | "medium" | "low" | "unscored";

interface TrustBadgeProps {
  tier: TrustTier;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const config = {
  high: {
    label: "High Trust",
    Icon: ShieldCheck,
    classes: "bg-emerald-500 text-white",
  },
  medium: {
    label: "Medium Trust",
    Icon: Clock,
    classes: "bg-amber-500 text-white",
  },
  low: {
    label: "Low Trust",
    Icon: Lock,
    classes: "bg-red-500 text-white",
  },
  unscored: {
    label: "Unscored",
    Icon: HelpCircle,
    classes: "bg-gray-300 text-gray-600 dark:bg-slate-600 dark:text-slate-300",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3 py-1.5 text-sm gap-2",
};

const iconSizes = { sm: 12, md: 14, lg: 16 };

export default function TrustBadge({
  tier,
  size = "md",
  className,
}: TrustBadgeProps) {
  const c = config[tier];
  const Icon = c.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        c.classes,
        sizeClasses[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      <span>{c.label}</span>
    </span>
  );
}

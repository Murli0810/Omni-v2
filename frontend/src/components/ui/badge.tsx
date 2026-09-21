import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "accent" | "critical" | "amber" | "blue" | "neutral" | "high" | "medium" | "low";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: "bg-accent-100 text-accent-700 border-accent-500/20",
  critical: "bg-critical-100 text-critical-600 border-critical-500/25",
  amber: "bg-amber-100 text-amber-700 border-amber-500/20",
  blue: "bg-sky-100 text-sky-700 border-sky-500/20",
  neutral: "bg-slate-100 text-slate-600 border-slate-300/40",
  high: "bg-critical-100 text-critical-600 border-critical-500/25",
  medium: "bg-amber-100 text-amber-700 border-amber-500/20",
  low: "bg-accent-100 text-accent-700 border-accent-500/20",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

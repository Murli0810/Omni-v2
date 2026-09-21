import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      primary: "bg-accent-600 text-white shadow-glass-sm hover:bg-accent-700 active:scale-[0.98]",
      glass:
        "glass-panel-sm text-slate-700 hover:bg-white/70 active:scale-[0.98]",
      ghost: "text-slate-600 hover:bg-white/40",
    };
    return <button ref={ref} className={cn(base, variants[variant], className)} {...props} />;
  }
);
Button.displayName = "Button";

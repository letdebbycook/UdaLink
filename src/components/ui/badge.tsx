import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "pro";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#16A34A] text-white",
    secondary: "bg-[#F1F5F9] text-[#475569]",
    outline: "text-[#0F172A] border border-[#E2E8F0]",
    success: "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]",
    warning: "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]",
    danger: "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]",
    pro: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-xs font-semibold",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

export { Badge };

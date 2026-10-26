import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonVariantsProps {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: ButtonVariantsProps = {}) {
  const variantStyles = {
    default: "bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm active:scale-[0.98]",
    secondary: "bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7] border border-[#BBF7D0]",
    outline: "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]",
    ghost: "hover:bg-[#F1F5F9] text-[#0F172A]",
    danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
    link: "text-[#16A34A] underline-offset-4 hover:underline p-0 h-auto",
  }[variant];

  const sizeStyles = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs rounded-md",
    lg: "h-12 px-6 text-base rounded-xl font-semibold",
    icon: "h-10 w-10 p-0 flex items-center justify-center",
  }[size];

  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
    variantStyles,
    sizeStyles,
    className
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantsProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };

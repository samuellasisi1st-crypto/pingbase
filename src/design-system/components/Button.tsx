import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "destructive" | "dark";
  size?: "sm" | "md" | "lg";
}
const variants = {
  primary:"bg-primary text-white hover:bg-primary-hover",
  secondary:"border border-border bg-panel text-foreground hover:bg-hover",
  tertiary:"bg-transparent text-secondary hover:bg-hover hover:text-foreground",
  destructive:"border border-red-strong/20 bg-red-soft text-red-strong hover:bg-red-strong hover:text-white",
  dark:"bg-foreground text-white hover:bg-secondary",
};
const sizes = { sm:"h-[30px] px-2.5 text-xs", md:"h-9 px-3.5 text-[13px]", lg:"h-10 px-4 text-sm" };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant="primary", size="md", className, type="button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn("inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-45", variants[variant], sizes[size], className)} {...props} />;
});

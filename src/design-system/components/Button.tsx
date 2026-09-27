import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "destructive" | "dark";
  size?: "sm" | "md" | "lg";
}
const variants = {
  primary:"border border-primary-dark/25 bg-primary text-white shadow-control hover:bg-primary-hover active:shadow-control-pressed",
  secondary:"border border-border-strong bg-panel text-foreground shadow-control hover:bg-hover active:shadow-control-pressed",
  tertiary:"border border-transparent bg-transparent text-secondary hover:border-border hover:bg-hover hover:text-foreground active:shadow-control-pressed",
  destructive:"border border-red-strong/25 bg-red-soft text-red-strong shadow-control hover:bg-red-strong hover:text-white active:shadow-control-pressed",
  dark:"border border-foreground bg-foreground text-white shadow-control hover:bg-secondary active:shadow-control-pressed",
};
const sizes = { sm:"h-[30px] px-2.5 text-label", md:"h-9 px-3.5 text-body", lg:"h-10 px-4 text-heading" };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant="primary", size="md", className, type="button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn("inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:translate-y-0", variants[variant], sizes[size], className)} {...props} />;
});

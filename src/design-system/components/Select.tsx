import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md" | "lg";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ size = "md", className, ...props }, ref) {
  return <select ref={ref} className={cn("w-full min-w-0 rounded-md border border-border bg-panel px-2.5 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 disabled:bg-hover disabled:opacity-60", size === "sm" ? "h-[30px]" : size === "lg" ? "h-10" : "h-9", className)} {...props} />;
});
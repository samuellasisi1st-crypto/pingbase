import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ checked, onCheckedChange, label, className, disabled, ...props }, ref) {
  return <button ref={ref} type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onCheckedChange?.(!checked)} className={cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:opacity-45", checked ? "border-primary bg-primary" : "border-border-strong bg-hover", className)} {...props}><span className={cn("absolute top-0.5 size-3.5 rounded-full bg-panel shadow-xs transition-[left]", checked ? "left-[18px]" : "left-0.5")} /></button>;
});
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: "neutral" | "cyan" | "green" | "yellow" | "purple" | "red"; size?: "sm" | "md"; }
const variants={neutral:"border-border bg-hover text-secondary",cyan:"border-cyan-mid/50 bg-cyan-soft text-primary-dark",green:"border-green-strong/15 bg-green-soft text-green-strong",yellow:"border-yellow-strong/25 bg-yellow-soft text-secondary",purple:"border-purple-strong/15 bg-purple-soft text-purple-strong",red:"border-red-strong/15 bg-red-soft text-red-strong"};
export const Badge=forwardRef<HTMLSpanElement,BadgeProps>(function Badge({variant="neutral",size="sm",className,...props},ref){return <span ref={ref} className={cn("inline-flex shrink-0 items-center gap-1 rounded-sm border font-medium",size==="sm"?"h-5 px-[7px] text-micro":"h-6 px-2.5 text-caption",variants[variant],className)} {...props}/>});

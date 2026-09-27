import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: "neutral" | "cyan" | "green" | "yellow" | "purple" | "red"; size?: "sm" | "md"; }
const variants={neutral:"bg-hover text-secondary",cyan:"bg-cyan-soft text-primary-dark",green:"bg-green-soft text-green-strong",yellow:"bg-yellow-soft text-secondary",purple:"bg-purple-soft text-purple-strong",red:"bg-red-soft text-red-strong"};
export const Badge=forwardRef<HTMLSpanElement,BadgeProps>(function Badge({variant="neutral",size="sm",className,...props},ref){return <span ref={ref} className={cn("inline-flex shrink-0 items-center gap-1 rounded-full font-medium",size==="sm"?"h-5 px-[7px] text-[10px]":"h-6 px-2.5 text-[11px]",variants[variant],className)} {...props}/>});

import { forwardRef, type HTMLAttributes } from "react";
import { Badge } from "./Badge";
import { cn } from "../lib/utils";
export interface AIHandlingPillProps extends HTMLAttributes<HTMLSpanElement> { state?:"handling"|"paused"|"human"|"attention"; }
const states={handling:{label:"AI handling",variant:"cyan"},paused:{label:"AI paused",variant:"neutral"},human:{label:"Human handling",variant:"purple"},attention:{label:"Needs attention",variant:"yellow"}} as const;
export const AIHandlingPill=forwardRef<HTMLSpanElement,AIHandlingPillProps>(function AIHandlingPill({state="handling",className,...props},ref){const item=states[state];return <Badge ref={ref} variant={item.variant} className={cn("gap-1.5",className)} {...props}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{item.label}</Badge>});

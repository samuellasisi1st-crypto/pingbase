import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { size?: "sm" | "md"; }
export const Textarea=forwardRef<HTMLTextAreaElement,TextareaProps>(function Textarea({size="md",className,...props},ref){return <textarea ref={ref} className={cn("w-full resize-y rounded-md border border-border bg-panel p-2.5 text-[13px] text-foreground placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20",size==="sm"?"min-h-[64px]":"min-h-[92px]",className)} {...props}/>});

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> { size?: "sm" | "md" | "lg"; }
export const Input=forwardRef<HTMLInputElement,InputProps>(function Input({size="md",className,...props},ref){return <input ref={ref} className={cn("w-full min-w-0 rounded-md border border-border bg-panel px-2.5 text-[13px] text-foreground placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 disabled:bg-hover disabled:opacity-60",size==="sm"?"h-[30px]":size==="lg"?"h-10":"h-9",className)} {...props}/>});

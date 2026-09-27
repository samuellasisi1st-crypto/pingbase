import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface CardProps extends HTMLAttributes<HTMLDivElement> { variant?: "default" | "subtle" | "outlined"; size?: "sm" | "md"; }
const variants={default:"border border-border bg-panel shadow-xs",subtle:"border border-border-subtle bg-panel-subtle",outlined:"border border-border bg-panel"};
export const Card=forwardRef<HTMLDivElement,CardProps>(function Card({variant="default",size="md",className,...props},ref){return <div ref={ref} className={cn("rounded-xl",variants[variant],size==="sm"?"p-3":"p-4",className)} {...props}/>});

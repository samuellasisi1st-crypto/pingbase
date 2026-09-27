import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "default" | "active" | "primary"; size?: "sm" | "md" | "lg"; }
const variants={default:"border border-transparent text-secondary hover:border-border hover:bg-hover hover:text-foreground",active:"border border-border-strong bg-panel text-foreground shadow-control",primary:"border border-primary-dark/25 bg-primary text-white shadow-control hover:bg-primary-hover active:shadow-control-pressed"};
const sizes={sm:"h-7 w-7",md:"h-8 w-8",lg:"h-9 w-9"};
export const IconButton=forwardRef<HTMLButtonElement,IconButtonProps>(function IconButton({variant="default",size="md",className,type="button",...props},ref){return <button ref={ref} type={type} className={cn("inline-grid shrink-0 place-items-center rounded-sm transition-[background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 active:translate-y-px disabled:opacity-40",variants[variant],sizes[size],className)} {...props}/>});

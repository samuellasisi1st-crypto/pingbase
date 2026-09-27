import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "default" | "active" | "primary"; size?: "sm" | "md" | "lg"; }
const variants={default:"text-secondary hover:bg-hover hover:text-foreground",active:"bg-panel text-foreground shadow-xs",primary:"bg-primary text-white hover:bg-primary-hover"};
const sizes={sm:"h-7 w-7",md:"h-8 w-8",lg:"h-9 w-9"};
export const IconButton=forwardRef<HTMLButtonElement,IconButtonProps>(function IconButton({variant="default",size="md",className,type="button",...props},ref){return <button ref={ref} type={type} className={cn("inline-grid shrink-0 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:opacity-40",variants[variant],sizes[size],className)} {...props}/>});

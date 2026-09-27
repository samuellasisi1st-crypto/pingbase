import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/utils";
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> { name:string; src?:string; size?: "xs" | "sm" | "md" | "lg" | "xl"; }
const sizes={xs:"h-5 w-5 text-[9px]",sm:"h-6 w-6 text-[10px]",md:"h-8 w-8 text-[11px]",lg:"h-10 w-10 text-xs",xl:"h-12 w-12 text-sm"};
export const Avatar=forwardRef<HTMLSpanElement,AvatarProps>(function Avatar({name,src,size="md",className,...props},ref){const initials=name.split(" ").map(part=>part[0]).slice(0,2).join("").toUpperCase();return <span ref={ref} role="img" aria-label={name} className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-hover font-semibold text-secondary",sizes[size],className)} {...props}>{src?<img src={src} alt="" className="h-full w-full object-cover"/>:initials}</span>});

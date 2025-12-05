"use client"

import * as React from "react"
import { twMerge } from "tailwind-merge"
import clsx from "clsx"

function cn(...inputs: Array<string | undefined | false | null>) {
  return twMerge(clsx(inputs))
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    const variants = {
      primary: "bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-indigo-600",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 focus-visible:ring-slate-700",
      outline: "border border-slate-800 text-slate-300 hover:text-slate-50 focus-visible:ring-slate-700",
      ghost: "text-slate-300 hover:text-slate-50",
      destructive: "bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-600",
    }
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

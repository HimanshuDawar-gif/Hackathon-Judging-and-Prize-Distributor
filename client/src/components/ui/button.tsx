"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 shadow-sm",
    ghost: "text-zinc-100 hover:bg-zinc-800",
  },
  size: {
    sm: "h-8 px-3 text-xs rounded-md gap-1.5",
    md: "h-9 px-4 text-sm rounded-md gap-2",
    lg: "h-10 px-6 text-sm rounded-md gap-2.5",
    icon: "h-9 w-9 rounded-md",
  },
} as const

type Variant = keyof typeof buttonVariants.variant
type Size = keyof typeof buttonVariants.size

function getVariantClasses(variant: Variant): string {
  return buttonVariants.variant[variant]
}

function getSizeClasses(size: Size): string {
  return buttonVariants.size[size]
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
          "disabled:pointer-events-none disabled:opacity-50",
          "cursor-pointer",
          getVariantClasses(variant),
          getSizeClasses(size),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

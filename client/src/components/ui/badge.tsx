"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  secondary: "bg-zinc-800 text-zinc-300 border-zinc-700",
  destructive: "bg-red-600/20 text-red-400 border-red-600/30",
  outline: "bg-transparent text-zinc-300 border-zinc-700",
} as const

type BadgeVariant = keyof typeof badgeVariants

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          badgeVariants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }

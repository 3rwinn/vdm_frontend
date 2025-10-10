"use client"

import * as React from "react"

import { Tooltip as RechartsTooltip, type TooltipProps } from "recharts"
import { cn } from "@/lib/utils"

export interface ChartConfig {
  [label: string]: {
    label: string
    color?: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({ className, config, children, ...props }: ChartContainerProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full min-w-0 flex-1 items-center justify-center",
        className
      )}
      data-chart-config={JSON.stringify(config)}
      {...props}
    >
      {children}
    </div>
  )
}

ChartContainer.displayName = "ChartContainer"

interface ChartTooltipProps extends TooltipProps<number, string> {
  className?: string
}

export function ChartTooltip({ className, ...props }: ChartTooltipProps) {
  return <RechartsTooltip {...props} content={<ChartTooltipContent className={className} />} />
}

type ChartTooltipContentProps = React.HTMLAttributes<HTMLDivElement>

export function ChartTooltipContent({ className, ...props }: ChartTooltipContentProps) {
  const { payload, label } = props as TooltipProps<number, string>

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-white px-3 py-2 text-xs shadow",
        className
      )}
    >
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color || "var(--foreground)" }}
            />
            <span>{item.name}</span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

ChartTooltipContent.displayName = "ChartTooltipContent"

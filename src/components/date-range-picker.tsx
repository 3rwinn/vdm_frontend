"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
}

const defaultLabels = {
  today: "Aujourd’hui",
  yesterday: "Hier",
  last7: "7 derniers jours",
  last30: "30 derniers jours",
  reset: "Réinitialiser",
}

const presetRanges = [
  { label: defaultLabels.today, range: { from: new Date(), to: new Date() } },
  { label: defaultLabels.yesterday, range: { from: addDays(new Date(), -1), to: addDays(new Date(), -1) } },
  { label: defaultLabels.last7, range: { from: addDays(new Date(), -6), to: new Date() } },
  { label: defaultLabels.last30, range: { from: addDays(new Date(), -29), to: new Date() } },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [range, setRange] = React.useState<DateRange | undefined>(value)

  const label = React.useMemo(() => {
    if (!range?.from && !range?.to) {
      return "Choisir une période"
    }
    const formatter = (date: Date) => format(date, "dd MMM yyyy")
    if (range?.from && range?.to) {
      return `${formatter(range.from)} – ${formatter(range.to)}`
    }
    if (range?.from) {
      return `${formatter(range.from)} – …`
    }
    if (range?.to) {
      return `… – ${formatter(range.to)}`
    }
    return "Choisir une période"
  }, [range?.from, range?.to])

  const handleSelect = (next: DateRange | undefined) => {
    setRange(next)
    onChange?.(next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-[#0c6e85]/40",
            !range?.from && !range?.to && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col gap-4 p-4" align="end">
        <div className="grid gap-2 text-sm">
          {presetRanges.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              className="justify-start rounded-lg px-3 py-2 text-left text-sm hover:bg-[#0c6e85]/10"
              onClick={() => handleSelect(preset.range)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="justify-start rounded-lg px-3 py-2 text-left text-sm text-[#f26a24] hover:bg-[#f26a24]/10"
            onClick={() => handleSelect(undefined)}
          >
            {defaultLabels.reset}
          </Button>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={range?.from ?? new Date()}
          selected={range}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemPeriod,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"

// import { Label } from "@/components/Label"

// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/Dialog"

import { PeriodValue } from "@/app/(main)/overview/page"
// import { Button } from "@/components/Button"
// import { Checkbox } from "@/components/Checkbox"
import { DateRangePicker } from "@/components/DatePicker"
// import { cx } from "@/lib/utils"
// import { RiSettings5Line } from "@remixicon/react"
import { eachDayOfInterval, interval, subDays, subYears } from "date-fns"
import React from "react"
import { DateRange } from "react-day-picker"
// import { ChartCard } from "./DashboardChartCard"



export const getPeriod = (
  dateRange: DateRange | undefined,
  value: PeriodValue,
): DateRange | undefined => {
  if (!dateRange) return undefined
  const from = dateRange.from
  const to = dateRange.to
  switch (value) {
    case "previous-period":
      let previousPeriodFrom
      let previousPeriodTo
      if (from && to) {
        const datesInterval = interval(from, to)
        const numberOfDaysBetween = eachDayOfInterval(datesInterval).length
        previousPeriodTo = subDays(from, 1)
        previousPeriodFrom = subDays(previousPeriodTo, numberOfDaysBetween)
      }
      return { from: previousPeriodFrom, to: previousPeriodTo }
    case "last-year":
      let lastYearFrom
      let lastYearTo
      if (from) {
        lastYearFrom = subYears(from, 1)
      }
      if (to) {
        lastYearTo = subYears(to, 1)
      }
      return { from: lastYearFrom, to: lastYearTo }
    case "no-comparison":
      return undefined
  }
}



type FilterbarProps = {
  maxDate?: Date
  minDate?: Date
  selectedDates: DateRange | undefined
  onDatesChange: (dates: DateRange | undefined) => void
  elements?: any[]
  selectedElement: string
  onElementChange: (element: string) => void
}

export function Filterbar({
  maxDate,
  minDate,
  selectedDates,
  onDatesChange,
  elements = [],
  selectedElement,
  onElementChange,
}: FilterbarProps) {
  return (
    <div className="flex w-full justify-between">
      <div className="w-full sm:flex sm:items-center sm:gap-2">
        <DateRangePicker
          value={selectedDates}
          onChange={onDatesChange}
          className="w-full sm:w-fit"
          toDate={maxDate}
          fromDate={minDate}
          align="start"
        />
        <span className="hidden text-sm font-medium text-gray-500 sm:block">
          pour l&apos;annonceur
        </span>
        <Select
          // defaultValue={elements[0].value}
          defaultValue={"Cliquer pour choisir"}
          value={selectedElement}
          onValueChange={(value) => {
            onElementChange(value as string)
          }}
        >
          <SelectTrigger className="mt-2 w-full px-2 sm:mt-0 sm:w-fit sm:py-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {elements.map((element) => (
              <SelectItem key={element.value} value={element.value}>
                {element.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

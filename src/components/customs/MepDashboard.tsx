"use client"
import React, { useState } from "react"
import { cx } from "@/lib/utils"
import { ProgressBar } from "../ProgressBar"
import { BarList } from "../BarList"
import { DonutChart } from "../DonutChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { DateRangePicker, DateRange } from "../DatePicker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { AreaChart } from "@/components/AreaChart"
import { BarChart } from "@/components/BarChart"
import { fr } from "date-fns/locale"
import { presets } from "@/lib/dateHelpers"

// Type definitions
type MepAnalysisData = {
  annonceur: {
    duree_commerciale: string
    nb_spots: number
    valorisation: string
  }
  concurrence: {
    duree_commerciale: string
    nb_spots: number
    valorisation: string
  }
  classement_produit: {
    global: {
      top_20_spots: Array<{ marque: string; value: number }>
      top_20_valorisation: Array<{ marque: string; value: string }>
      top_20_duration: Array<{ marque: string; value: string }>
    }
    specific: {
      top_20_spots: Array<{ marque: string; value: number }>
      top_20_valorisation: Array<{ marque: string; value: string }>
      top_20_duration: Array<{ marque: string; value: string }>
    }
  }
  hourly_data?: {
    [key: string]: {
      annonceur: {
        duree_commerciale: string
        nb_spots: number
        valorisation: string
      }
      global: {
        duree_commerciale: string
        nb_spots: number
        valorisation: string
      }
    }
  }
  days_data?: {
    [key: string]: {
      annonceur: {
        duree_commerciale: string
        nb_spots: number
        valorisation: string
      }
      global: {
        duree_commerciale: string
        nb_spots: number
        valorisation: string
      }
    }
  }
}

type MepDashboardProps = {
  data?: {
    success: boolean
    mep_analysis: MepAnalysisData
  }
  workspace?: {
    id_client: string
    sector_activity?: string
  }
  dateRange?: DateRange
  handleDateRangeChange?: (range: { from: Date; to: Date }) => void
}

// Helper functions
function formatDuration(duration: string): string {
  if (!duration) return "00:00:00"
  return duration
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

function parseValueToNumber(value: string): number {
  if (!value) return 0
  return parseInt(value.replace(/\s/g, ""))
}

function valueFormatter(number: number): string {
  return `${Intl.NumberFormat("fr").format(number).toString()} FCFA`
}

function valueFormatterSimple(number: number): string {
  return `${Intl.NumberFormat("fr").format(number).toString()}`
}

// Add new helper functions for chart data transformation
function hourlyToSpotsChartData(
  hourlyData?: MepAnalysisData["hourly_data"],
  clientName?: string,
) {
  if (!hourlyData) return []

  const label = clientName || "Annonceur"
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour,
    [label]: data.annonceur.nb_spots,
    CONCURRENCE: data.global.nb_spots,
  }))
}

function hourlyToValorisationChartData(
  hourlyData?: MepAnalysisData["hourly_data"],
  clientName?: string,
) {
  if (!hourlyData) return []

  const label = clientName || "Annonceur"
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour,
    [label]: parseValueToNumber(data.annonceur.valorisation),
    CONCURRENCE: parseValueToNumber(data.global.valorisation),
  }))
}

function fourHourlyValorisationData(
  hourlyData?: MepAnalysisData["hourly_data"],
  clientName?: string,
) {
  if (!hourlyData) return []

  const label = clientName || "Annonceur"
  const fourHourGroups: Record<string, { [key: string]: number }> = {}

  Object.entries(hourlyData).forEach(([hour, data]) => {
    const hourNum = parseInt(hour.split("H")[0])
    const groupKey = `${Math.floor(hourNum / 4) * 4}H-${Math.floor(hourNum / 4) * 4 + 4}H`

    if (!fourHourGroups[groupKey]) {
      fourHourGroups[groupKey] = { [label]: 0, CONCURRENCE: 0 }
    }

    fourHourGroups[groupKey][label] += parseValueToNumber(
      data.annonceur.valorisation,
    )
    fourHourGroups[groupKey].CONCURRENCE += parseValueToNumber(
      data.global.valorisation,
    )
  })

  return Object.entries(fourHourGroups).map(([timeRange, data]) => ({
    timeRange,
    [label]: data[label],
    CONCURRENCE: data.CONCURRENCE,
  }))
}

// Add a new formatter function for large numbers
function formatLargeNumber(number: number): string {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M FCFA`
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K FCFA`
  } else {
    return `${number} FCFA`
  }
}

// Add a helper function to convert HH:MM:SS to minutes
function timeStringToMinutes(timeString: string): number {
  if (!timeString) return 0
  const [hours, minutes, seconds] = timeString.split(":").map(Number)
  return hours * 60 + minutes + seconds / 60
}

// Add new helper functions for daily data transformation
function daysToSpotsChartData(
  daysData?: MepAnalysisData["days_data"],
  clientName?: string,
) {
  if (!daysData) return []

  const label = clientName || "Annonceur"
  return Object.entries(daysData).map(([day, data]) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    [label]: data.annonceur.nb_spots,
    CONCURRENCE: data.global.nb_spots,
  }))
}

function daysToValorisationChartData(
  daysData?: MepAnalysisData["days_data"],
  clientName?: string,
) {
  if (!daysData) return []

  const label = clientName || "Annonceur"
  return Object.entries(daysData).map(([day, data]) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    [label]: parseValueToNumber(data.annonceur.valorisation),
    CONCURRENCE: parseValueToNumber(data.global.valorisation),
  }))
}

// Update the daysToDurationChartData function
function daysToDurationChartData(
  daysData?: MepAnalysisData["days_data"],
  clientName?: string,
) {
  if (!daysData) return []

  const label = clientName || "Annonceur"
  return Object.entries(daysData).map(([day, data]) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    [label]: timeStringToMinutes(data.annonceur.duree_commerciale),
    CONCURRENCE: timeStringToMinutes(data.global.duree_commerciale),
  }))
}

// Add a custom formatter for minutes to HH:MM display
function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
  }
  return `${mins}m`
}


function MepDashboard({
  data,
  workspace,
  dateRange,
  handleDateRangeChange,
}: MepDashboardProps) {
  const [analysisMode, setAnalysisMode] = useState<"global" | "specific">(
    "global",
  )

  console.log("real_data", data)
  console.log("real_workspace", workspace)

  // Calculate percentages for spots and valorisation
  const totalSpots =
    data?.mep_analysis.annonceur.nb_spots +
      data?.mep_analysis.concurrence.nb_spots || 0
  const spotsPercentage = calculatePercentage(
    data?.mep_analysis.annonceur.nb_spots || 0,
    totalSpots,
  )

  const annonceurValorisation = parseValueToNumber(
    data?.mep_analysis.annonceur.valorisation || "0",
  )
  const concurrenceValorisation = parseValueToNumber(
    data?.mep_analysis.concurrence.valorisation || "0",
  )
  const totalValorisation = annonceurValorisation + concurrenceValorisation
  const valorisationPercentage = calculatePercentage(
    annonceurValorisation,
    totalValorisation,
  )

  const skeleton = (
    <>
      <section aria-labelledby="usage-overview">
        <h1 className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <dl className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <dd className="mt-2 flex items-baseline gap-2">
                <span className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </dd>
              <ul className="mt-6 space-y-5">
                <li>
                  <p className="flex justify-between">
                    <span className="h-4 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <span className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  </p>
                  <div className="mt-2 h-1.5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                </li>
                <li>
                  <p className="flex justify-between">
                    <span className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <span className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  </p>
                  <div className="mt-2 h-1.5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                </li>
              </ul>
            </div>
          </div>
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-64 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-64 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </dl>
      </section>
    </>
  )

  const emptyState = (
    <>
      <h1
        id="usage-overview"
        className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50"
      >
        Vue d&apos;ensemble
      </h1>
      <div className="mt-4">
        {dateRange && handleDateRangeChange && (
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            className="w-60"
            translations={{
              cancel: "Annuler",
              apply: "Appliquer",
              range: "Intervalle de dates",
            }}
            locale={fr}
            presets={presets}
          />
        )}
      </div>
      <section className="mt-12 text-center">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Aucune donnée disponible
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Nous n&apos;avons pas de données pour la période sélectionnée.
          </p>
        </div>
      </section>
    </>
  )

  if (!data) return skeleton

  if (!data.success) return emptyState

  return (
    <>
      <section aria-labelledby="usage-overview">
        <h1
          id="usage-overview"
          className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50"
        >
          Vue d&apos;ensemble
        </h1>
        <div className="mt-4">
          {dateRange && handleDateRangeChange && (
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-60"
              translations={{
                cancel: "Annuler",
                apply: "Appliquer",
                range: "Intervalle de dates",
              }}
              locale={fr}
              presets={presets}
            />
          )}
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div key="1">
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Nombre de spots total
                </dt>
              </div>
              <dd className="mt-2 flex items-baseline gap-2">
                <span className="text-xl text-gray-900 dark:text-gray-50">
                  {totalSpots}
                </span>
              </dd>
              <ul role="list" className="mt-6 space-y-5">
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {workspace?.id_client || "Annonceur"}
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {data.mep_analysis.annonceur.nb_spots}
                    </span>
                  </p>
                  <ProgressBar
                    variant="indigo"
                    value={spotsPercentage}
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      Concurrence
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {data.mep_analysis.concurrence.nb_spots}
                    </span>
                  </p>
                  <ProgressBar
                    variant="neutral"
                    value={100 - spotsPercentage}
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
              </ul>
            </div>
          </div>
          <div key="2">
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Valorisation totale
                </dt>
              </div>
              <dd className="mt-2 flex items-baseline gap-2">
                <span className="text-xl text-gray-900 dark:text-gray-50">
                  {valueFormatter(totalValorisation)}
                </span>
              </dd>
              <ul role="list" className="mt-6 space-y-5">
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {workspace?.id_client || "Annonceur"}
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {data.mep_analysis.annonceur.valorisation} FCFA
                    </span>
                  </p>
                  <ProgressBar
                    variant="indigo"
                    value={valorisationPercentage}
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      Concurrence
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {data.mep_analysis.concurrence.valorisation} FCFA
                    </span>
                  </p>
                  <ProgressBar
                    variant="neutral"
                    value={100 - valorisationPercentage}
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
              </ul>
            </div>
          </div>
          <div key="3">
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Durée commerciale totale
                </h3>
              </div>{" "}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  Répartition
                </p>
                <div className="mt-2 flex items-center gap-0.5">
                  <div
                    className={cx(
                      "h-1.5 rounded-full bg-purple-600 dark:bg-purple-500",
                    )}
                    style={{
                      width: `${calculatePercentage(
                        parseValueToNumber(
                          data.mep_analysis.annonceur.duree_commerciale,
                        ),
                        parseValueToNumber(
                          data.mep_analysis.annonceur.duree_commerciale,
                        ) +
                          parseValueToNumber(
                            data.mep_analysis.concurrence.duree_commerciale,
                          ),
                      )}%`,
                    }}
                  />

                  <div
                    className={cx(
                      "h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500",
                    )}
                    style={{
                      width: `${calculatePercentage(
                        parseValueToNumber(
                          data.mep_analysis.concurrence.duree_commerciale,
                        ),
                        parseValueToNumber(
                          data.mep_analysis.annonceur.duree_commerciale,
                        ) +
                          parseValueToNumber(
                            data.mep_analysis.concurrence.duree_commerciale,
                          ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
              {/*
              <div className="mt-6">
                <DonutChart
                  data={[
                    {
                      name: workspace?.id_client || "Annonceur",
                      value: formatDuration(
                        data.mep_analysis.annonceur.duree_commerciale,
                      ),
                      color: "indigo",
                    },
                    {
                      name: "Concurrence",
                      value: formatDuration(
                        data.mep_analysis.concurrence.duree_commerciale,
                      ),
                      color: "gray",
                    },
                  ]}
                  category="value"
                  index="name"
                  variant="pie"
                  valueFormatter={(value: string) => value}
                  colors={["indigo", "gray"]} 
                  className="h-52"
                /> 
              </div>*/}
              <ul role="list" className="mt-5 space-y-2">
                <li className="flex items-center gap-2 text-xs">
                  <span
                    className={cx(
                      "size-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500",
                    )}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {workspace?.id_client || "Annonceur"}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDuration(
                      data.mep_analysis.annonceur.duree_commerciale,
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span
                    className={cx(
                      "size-2.5 rounded-sm bg-gray-500 dark:bg-gray-400",
                    )}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    Concurrence
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDuration(
                      data.mep_analysis.concurrence.duree_commerciale,
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </dl>
      </section>

      {/* New section for daily charts */}
      {data?.mep_analysis.days_data && (
        <section className="mt-12">
          <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Nombre de spots par jour
                  </dt>
                </div>
                <AreaChart
                  className="mt-4 h-64"
                  data={daysToSpotsChartData(
                    data.mep_analysis.days_data,
                    workspace?.id_client,
                  )}
                  index="day"
                  categories={[
                    workspace?.id_client || "Annonceur",
                    "CONCURRENCE",
                  ]}
                  colors={["indigo", "gray"]}
                  valueFormatter={valueFormatterSimple}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Valorisation par jour
                  </dt>
                </div>
                <AreaChart
                  className="mt-4 h-64"
                  data={daysToValorisationChartData(
                    data.mep_analysis.days_data,
                    workspace?.id_client,
                  )}
                  index="day"
                  categories={[
                    workspace?.id_client || "Annonceur",
                    "CONCURRENCE",
                  ]}
                  colors={["indigo", "gray"]}
                  valueFormatter={formatLargeNumber}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Durée commerciale par jour
                  </dt>
                </div>
                <AreaChart
                  className="mt-4 h-64"
                  data={daysToDurationChartData(
                    data.mep_analysis.days_data,
                    workspace?.id_client,
                  )}
                  index="day"
                  categories={[
                    workspace?.id_client || "Annonceur",
                    "CONCURRENCE",
                  ]}
                  colors={["indigo", "gray"]}
                  valueFormatter={formatMinutes}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New section for hourly charts */}
      {data?.mep_analysis.hourly_data && (
        <section className="mt-12">
          {/* <h1 className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
            Analyse horaire
          </h1> */}

          <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Nombre de spots par heure
                  </dt>
                </div>
                <AreaChart
                  className="mt-4 h-64"
                  data={hourlyToSpotsChartData(
                    data.mep_analysis.hourly_data,
                    workspace?.id_client,
                  )}
                  index="hour"
                  categories={[
                    workspace?.id_client || "Annonceur",
                    "CONCURRENCE",
                  ]}
                  colors={["indigo", "gray"]}
                  valueFormatter={valueFormatterSimple}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Valorisation par heure
                  </dt>
                </div>
                <AreaChart
                  className="mt-4 h-64"
                  data={hourlyToValorisationChartData(
                    data.mep_analysis.hourly_data,
                    workspace?.id_client,
                  )}
                  index="hour"
                  categories={[
                    workspace?.id_client || "Annonceur",
                    "CONCURRENCE",
                  ]}
                  colors={["indigo", "gray"]}
                  valueFormatter={formatLargeNumber}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Valorisation par tranche de 4 heures
                  </dt>
                </div>
                <BarChart
                  className="mt-4 h-64"
                  data={fourHourlyValorisationData(
                    data.mep_analysis.hourly_data,
                    workspace?.id_client,
                  )}
                  index="timeRange"
                  categories={[
                    workspace?.id_client || "Annonceur",
                    "CONCURRENCE",
                  ]}
                  colors={["indigo", "gray"]}
                  valueFormatter={formatLargeNumber}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-center gap-4">
          <h1 className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
            Classement des produits
          </h1>
          <Select
            value={analysisMode}
            onValueChange={(value: "global" | "specific") =>
              setAnalysisMode(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner le mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">TOUS LES ANNONCEURS</SelectItem>
              <SelectItem value="specific">
                {workspace?.id_client || "SPÉCIFIQUE"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Top 20 par nombre de spots
                </dt>
              </div>
              <div className="mt-6">
                <BarList
                  data={data.mep_analysis.classement_produit[
                    analysisMode
                  ].top_20_spots.map((item) => ({
                    name: item.marque,
                    value: item.value,
                  }))}
                  valueFormatter={valueFormatterSimple}
                />
              </div>
            </div>
          </div>
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Top 20 par valorisation
                </dt>
              </div>
              <div className="mt-6">
                <BarList
                  data={data.mep_analysis.classement_produit[
                    analysisMode
                  ].top_20_valorisation.map((item) => ({
                    name: item.marque,
                    value: parseValueToNumber(item.value),
                  }))}
                  valueFormatter={valueFormatter}
                />
              </div>
            </div>
          </div>
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Top 20 par durée
                </dt>
              </div>
              <div className="mt-6">
                <BarList
                  data={data.mep_analysis.classement_produit[
                    analysisMode
                  ].top_20_duration.map((item) => ({
                    name: item.marque,
                    value: item.value,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default MepDashboard

"use client"
import React, { useEffect, useState } from "react"
import { cx } from "@/lib/utils"
// import { Card } from "../Card"
import { ProgressBar } from "../ProgressBar"
import { AreaChart } from "@/components/AreaChart"
import { BarChart } from "@/components/BarChart"
// import { BarList } from "../BarList"
// import { LineChart } from "../LineChart"
import { ComboChart } from "../ComboChart"
// import { List } from "@radix-ui/react-tabs"
import { DonutChart } from "../DonutChart"
import { Label } from "@radix-ui/react-label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { BarList } from "../BarList"
import { ProgressCircle } from "@/components/ProgressCircle"
import { DateRangePicker } from "../DatePicker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { fr } from "date-fns/locale"
import { presets } from "@/lib/dateHelpers"




function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

function convertToSeconds(distribution: string): number {
  if (!distribution) return 0
  const [days, hours, minutes, seconds] = distribution?.split("/").map(Number)
  return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds
}

function calculatePercentage(value: string, total: string): number {
  const valueInSeconds = convertToSeconds(value)
  const totalInSeconds = convertToSeconds(total)
  return (valueInSeconds / totalInSeconds) * 100
}

function spotToChartData(datas) {
  if (!datas) return []

  return datas?.date?.map((item, index) => {
    return {
      // date: formatDate(item),
      date: item.split("-").reverse().join("-"),
      Spots: datas?.spot_count[index],
      Concurence: Math.random(),
    }
  })
}

function hourToChartData(datas) {
  if (!datas) return []

  return datas?.spot_key?.map((item, index) => {
    return {
      heure: item,
      Spots: datas?.spot_count[index],
      Concurence: Math.random(),
    }
  })
}

function valorisationToChartData(datas) {
  if (!datas) return []

  return datas?.spot_key?.map((item, index) => {
    return {
      heure: item,
      valorisation: datas?.valorization[index],
    }
  })
}

function sectorToComboChartData(datas) {
  if (!datas) return []

  return datas?.date?.map((item, index) => {
    return {
      date: item.split("-").reverse().join("-"),
      Spots: datas?.spots[index],
      Valorisation: datas?.valorization[index],
    }
  })
}

function advertiserToBarChartData(datas) {
  if (!datas) return []

  return datas?.annonceur?.map((item, index) => {
    return {
      name: item,
      spot: datas?.spots[index],
      valorisation: datas?.valorisation[index],
    }
  })
}

function advertiserToBarChartDataWithMode(datas, mode) {
  if (!datas) return []

  return datas?.annonceur?.map((item, index) => {
    return {
      name: item,
      value: mode === "spot" ? datas?.spots[index] : datas?.valorisation[index],
    }
  })
}

function channelToDonutChartData(datas) {
  if (!datas) return []

  return datas?.chaine?.map((item, index) => {
    return {
      name: item,
      spots: datas?.spots[index],
      valorisation: datas?.valorisation[index],
    }
  })
}

const valueFormatter = (number) =>
  `${Intl.NumberFormat("fr").format(number).toString()} FCFA`

const valueFormatterSimple = (number) =>
  `${Intl.NumberFormat("fr").format(number).toString()}`

// Add this type definition for clarity
type SectorAnalysisMode = "global" | "specific"

function MepChaineDashboard({
  datas,
  mode = "tv",
  workspace,
  dateRange,
  handleDateRangeChange,
}) {
  const tvPercentage =
    calculatePercentage(
      datas?.tv?.duree_commercial_total,
      datas?.general?.duree_commercial_total,
    ) || 0
  const radioPercentage =
    calculatePercentage(
      datas?.radio?.duree_commercial_total,
      datas?.general?.duree_commercial_total,
    ) || 0

  const channelPercentage =
    calculatePercentage(
      datas?.channel?.duree_commercial_total,
      datas?.general?.duree_commercial_total,
    ) || 0

  console.log("rra datas", datas)

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

      <section className="mt-12">
        <h1 className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-64 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
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
      </div>
      <section className="mt-12 text-center">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Aucune donnée disponible
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Nous n'avons pas de données pour la période sélectionnée.
          </p>
        </div>
      </section>
    </>
  )

  const classementAnnonceur = [
    {
      name: "Spots",
      data: advertiserToBarChartDataWithMode(
        datas?.sector?.advertiser_metrics,
        "spot",
      ),
      category: "spot",
    },
    {
      name: "Valorisation",
      data: advertiserToBarChartDataWithMode(
        datas?.sector?.advertiser_metrics,
        "valorisation",
      ),
      category: "valorisation",
    },
  ]

  // Inside the MepChaineDashboard component, add state for the analysis mode
  const [sectorAnalysisMode, setSectorAnalysisMode] =
    useState<SectorAnalysisMode>("specific")

  if (datas?.statut === "no_data") return emptyState

  if (!datas) return skeleton

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
                  {datas?.general?.nombre_spots_total || 0}
                </span>
              </dd>
              <ul role="list" className="mt-6 space-y-5">
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {mode === "tv" ? "TV" : "RADIO"}
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {mode === "tv"
                        ? datas?.tv?.nombre_spots_total || 0
                        : datas?.radio?.nombre_spots_total || 0}
                    </span>
                  </p>
                  <ProgressBar
                    variant="indigo"
                    value={
                      (datas?.tv?.nombre_spots_total /
                        datas?.general?.nombre_spots_total) *
                      100
                    }
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {workspace?.id_client}
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {datas?.channel?.nombre_spots_total || 0}
                    </span>
                  </p>
                  <ProgressBar
                    value={
                      (datas?.channel?.nombre_spots_total /
                        datas?.general?.nombre_spots_total) *
                      100
                    }
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
                {/* <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      RADIO
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {datas?.radio?.nombre_spots_total || 0}
                    </span>
                  </p>
                  <ProgressBar
                    variant="neutral"
                    value={
                      (datas?.radio?.nombre_spots_total /
                        datas?.general?.nombre_spots_total) *
                      100
                    }
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li> */}
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
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                  }).format(datas?.general?.total_valorization) || 0}
                </span>
              </dd>
              <ul role="list" className="mt-6 space-y-5">
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {mode === "tv" ? "TV" : "RADIO"}
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "XOF",
                      }).format(datas?.tv?.total_valorization)}
                    </span>
                  </p>
                  <ProgressBar
                    variant="indigo"
                    value={
                      mode === "tv"
                        ? (datas?.tv?.total_valorization /
                            datas?.general?.total_valorization) *
                          100
                        : (datas?.radio?.total_valorization /
                            datas?.general?.total_valorization) *
                          100
                    }
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>
                <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {workspace?.id_client}
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "XOF",
                      }).format(datas?.channel?.total_valorization)}
                    </span>
                  </p>
                  <ProgressBar
                    value={
                      (datas?.channel?.total_valorization /
                        datas?.general?.total_valorization) *
                      100
                    }
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li>

                {/* <li>
                  <p className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      RADIO
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-50">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "XOF",
                      }).format(datas?.radio?.total_valorization)}
                    </span>
                  </p>
                  <ProgressBar
                    variant="neutral"
                    value={
                      (datas?.radio?.total_valorization /
                        datas?.general?.total_valorization) *
                      100
                    }
                    className="mt-2 [&>*]:h-1.5"
                  />
                </li> */}
              </ul>
            </div>
          </div>
          <div key="3">
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Durée commerciale totale
                </h3>
              </div>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-xl text-gray-900 dark:text-gray-50">
                  {datas?.general?.duree_commercial_total
                    ?.split("/")
                    .map((value, index) => {
                      const labels = ["j", "h", "m", "s"]
                      return (
                        <React.Fragment key={index}>
                          {value} {labels[index]}{" "}
                        </React.Fragment>
                      )
                    })}
                </span>
              </p>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  Répartition
                </p>
                <div className="mt-2 flex items-center gap-0.5">
                  <div
                    className={cx(
                      // "h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500",
                      "h-1.5 rounded-full bg-purple-600 dark:bg-purple-500",
                    )}
                    style={{
                      width: `${mode === "tv" ? tvPercentage : radioPercentage}%`,
                    }}
                  />

                  <div
                    className={cx(
                      "h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500",
                    )}
                    style={{ width: `${channelPercentage}%` }}
                  />

                  {/* <div
                    className={cx(
                      "h-1.5 rounded-full bg-gray-500 dark:bg-gray-400",
                    )}
                    style={{ width: `${radioPercentage}%` }}
                  /> */}
                </div>
              </div>

              <ul role="list" className="mt-5 space-y-2">
                {mode === "tv" && (
                  <li className="flex items-center gap-2 text-xs">
                    <span
                      className={cx(
                        // "size-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500",
                        "size-2.5 rounded-sm bg-purple-600 dark:bg-purple-500",
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      TV
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {datas?.tv?.duree_commercial_total
                        ?.split("/")
                        .map((value, index) => {
                          const labels = ["j", "h", "m", "s"]
                          return (
                            <React.Fragment key={index}>
                              {value} {labels[index]}{" "}
                            </React.Fragment>
                          )
                        })}{" "}
                      / {Math.round(tvPercentage) || 0}%
                    </span>
                  </li>
                )}
                {mode === "radio" && (
                  <li className="flex items-center gap-2 text-xs">
                    <span
                      className={cx(
                        "size-2.5 rounded-sm bg-gray-500 dark:bg-gray-400",
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      RADIO
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {datas?.radio?.duree_commercial_total
                        ?.split("/")
                        .map((value, index) => {
                          const labels = ["j", "h", "m", "s"]
                          return (
                            <React.Fragment key={index}>
                              {value} {labels[index]}{" "}
                            </React.Fragment>
                          )
                        })}{" "}
                      / {Math.round(radioPercentage) || 0}%
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-2 text-xs">
                  <span
                    className={cx(
                      // "size-2.5 rounded-sm bg-purple-600 dark:bg-purple-500",
                      "size-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500",
                    )}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {workspace?.id_client}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {datas?.channel?.duree_commercial_total
                      ?.split("/")
                      .map((value, index) => {
                        const labels = ["j", "h", "m", "s"]
                        return (
                          <React.Fragment key={index}>
                            {value} {labels[index]}{" "}
                          </React.Fragment>
                        )
                      })}{" "}
                    / {Math.round(channelPercentage) || 0}%
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </dl>
      </section>

      <section className="mt-12">
        {/* <h1
          id="usage-overview"
          className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50"
        >
          Vue spécifique pour {workspace?.id_client}
        </h1> */}

        <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Nombre de spots par jour
                </dt>
              </div>
              <AreaChart
                colors={["indigo"]}
                className="h-64"
                data={spotToChartData(datas?.daily_metrics)}
                index="date"
                startEndOnly={true}
                // categories={["Nci", "Concurence"]}
                categories={["Spots"]}
                onValueChange={(v) => console.log(v)}
              />
            </div>
          </div>
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Heure de passage des spots
                </dt>
              </div>
              {/* <BarChart */}
              <AreaChart
                className="h-64"
                data={hourToChartData(datas?.time_slot_metrics)}
                index="heure"
                colors={["indigo"]}
                // categories={["Nci", "Concurence"]}
                categories={["Spots"]}
                onValueChange={(v) => console.log(v)}
              />
            </div>
          </div>
          <div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Valorisation des heures de passage
                </dt>
              </div>
              <BarChart
                className="h-64"
                data={valorisationToChartData(datas?.time_slot_metrics)}
                index="heure"
                valueFormatter={valueFormatter}
                colors={["indigo"]}
                // categories={["Nci", "Concurence"]}
                categories={["valorisation"]}
                layout="vertical"
                onValueChange={(v) => console.log(v)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-4">
          <h1 className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
            Analyse sectorielle{" "}
            {/* {sectorAnalysisMode === "specific" && workspace?.sector_activity} */}
          </h1>
          <Select
            value={sectorAnalysisMode}
            onValueChange={(value: SectorAnalysisMode) =>
              setSectorAnalysisMode(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner le mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">GLOBALE</SelectItem>
              <SelectItem value="specific">
                {workspace?.sector_activity}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sectorAnalysisMode === "global" ? (
          <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Classement des secteurs par spots
                  </dt>
                </div>
                <div className="mt-6" />
                <BarList
                  data={datas?.sector_stats?.by_spots.map((item) => ({
                    name: item.sector,
                    value: item.value,
                  }))}
                  valueFormatter={valueFormatterSimple}
                />
              </div>
            </div>
            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Classement des secteurs par valorisation
                  </dt>
                </div>
                <div className="mt-6" />
                <BarList
                  data={datas?.sector_stats?.by_valorisation.map((item) => ({
                    name: item.sector,
                    value: parseInt(item.value.replace(/\s/g, "")),
                  }))}
                  valueFormatter={valueFormatter}
                />
              </div>
            </div>
            <div>
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                    Classement des secteurs par durée
                  </dt>
                </div>
                <div className="mt-6" />
                <BarList
                  data={datas?.sector_stats?.by_duration.map((item) => ({
                    name: item.sector,
                    value: item.value,
                  }))}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                  Nombre de spots et valorisation par jour sur le secteur
                </dt>
              </div>
              <ComboChart
                data={sectorToComboChartData(datas?.sector?.daily_metrics)}
                className="h-64"
                index="date"
                enableBiaxial={true}
                barSeries={{
                  categories: ["Spots"],
                  yAxisLabel: "Spots (Bars)",
                  colors: ["indigo"],
                }}
                lineSeries={{
                  categories: ["Valorisation"],
                  showYAxis: true,
                  yAxisLabel: "Valorisation (Line)",
                  colors: ["gray"],
                  yAxisWidth: 60,
                  valueFormatter: (number: number) =>
                    `${Intl.NumberFormat("fr").format(number).toString()} FCFA`,
                }}
              />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-2">
              <div>
                <div className="flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                      Valorisation & nombre total de spots sur le secteur
                    </dt>
                  </div>

                  <div className="items-start p-6 sm:flex sm:flex-wrap sm:items-center sm:space-x-0 sm:space-y-4 sm:p-0 sm:pt-6">
                    <ProgressCircle
                      value={Math.round(
                        (datas?.sector?.channel_metrics?.spots[0] * 100) /
                          datas?.channel?.nombre_spots_total,
                      )}
                      radius={70}
                      strokeWidth={7}
                    >
                      <ProgressCircle
                        value={Math.round(
                          (datas?.sector?.channel_metrics?.valorisation[0] *
                            100) /
                            datas?.channel?.total_valorization,
                        )}
                        radius={60}
                        strokeWidth={7}
                        variant={"neutral"}
                      >
                        {/* <span>Repartition spot & valorisation</span> */}
                      </ProgressCircle>
                    </ProgressCircle>
                    <ul role="list" className="mt-4 w-full sm:mt-0">
                      <li
                        key={"spot"}
                        className="rounded-tremor-small hover:bg-tremor-background-muted hover:dark:bg-dark-tremor-background-subtle relative px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={classNames(
                                "bg-indigo-500",
                                "size-2.5 rounded-sm",
                              )}
                              aria-hidden={true}
                            />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                              <a href={"#"} className="focus:outline-none">
                                {/* Extend touch target to entire panel */}
                                <span
                                  className="absolute inset-0"
                                  aria-hidden={true}
                                />
                                Taux spots secteur
                              </a>
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {Math.round(
                              (datas?.sector?.channel_metrics?.spots[0] * 100) /
                                datas?.channel?.nombre_spots_total,
                            )}
                            &#37;
                          </p>
                        </div>
                        <ul
                          role="list"
                          className="divide-y divide-gray-200 text-sm text-gray-500 dark:divide-gray-800 dark:text-gray-500"
                        >
                          <li
                            key="spot"
                            className="flex items-center justify-between py-2"
                          >
                            <span>Nb spots secteur</span>
                            <span>
                              {datas?.sector?.channel_metrics?.spots[0]}
                            </span>
                          </li>

                          <li
                            key="spot"
                            className="flex items-center justify-between py-2"
                          >
                            <span>Nb spots {workspace?.id_client}</span>
                            <span>{datas?.channel?.nombre_spots_total}</span>
                          </li>
                        </ul>
                      </li>
                      <li
                        key={"spot"}
                        className="rounded-tremor-small hover:bg-tremor-background-muted hover:dark:bg-dark-tremor-background-subtle relative px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={classNames(
                                "bg-gray-500",
                                "size-2.5 rounded-sm",
                              )}
                              aria-hidden={true}
                            />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                              <a href={"#"} className="focus:outline-none">
                                {/* Extend touch target to entire panel */}
                                <span
                                  className="absolute inset-0"
                                  aria-hidden={true}
                                />
                                Taux valorisation secteur
                              </a>
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {Math.round(
                              (datas?.sector?.channel_metrics?.valorisation[0] *
                                100) /
                                datas?.channel?.total_valorization,
                            )}
                            &#37;
                          </p>
                        </div>
                        <ul
                          role="list"
                          className="divide-y divide-gray-200 text-sm text-gray-500 dark:divide-gray-800 dark:text-gray-500"
                        >
                          <li
                            key="spot"
                            className="flex items-center justify-between py-2"
                          >
                            <span>Valorisation secteur</span>
                            <span>
                              {valueFormatter(
                                datas?.sector?.channel_metrics?.valorisation[0],
                              )}
                            </span>
                          </li>

                          <li
                            key="spot"
                            className="flex items-center justify-between py-2"
                          >
                            <span>Valorisation {workspace?.id_client}</span>
                            <span>
                              {valueFormatter(
                                datas?.channel?.total_valorization,
                              )}
                            </span>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Tabs defaultValue={classementAnnonceur[1].name}>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <dt className="font-bold text-gray-900 sm:text-sm dark:text-gray-50">
                        Classement des annonceurs sur le secteur
                      </dt>
                    </div>
                    <div className="mt-6">
                      <TabsList
                        variant="solid"
                        className="overflow-visible bg-transparent p-0 dark:bg-transparent"
                      >
                        {classementAnnonceur.map((item, index) => (
                          <TabsTrigger
                            key={index}
                            value={item.name}
                            className="rounded-md data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-gray-200 data-[state=active]:dark:ring-gray-800"
                          >
                            {item.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    <div className="mt-6">
                      {classementAnnonceur?.map((item) => (
                        <TabsContent key={item.name} value={item.name}>
                          <BarList
                            data={item.data}
                            valueFormatter={
                              item.category === "spot"
                                ? valueFormatterSimple
                                : valueFormatter
                            }
                          />
                        </TabsContent>
                      ))}
                    </div>
                  </div>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  )
}

export default MepChaineDashboard

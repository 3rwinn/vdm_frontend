"use client"
// import { CategoryBarCard } from "@/components/ui/overview/DashboardCategoryBarCard"
// import { ProgressBarCard } from "@/components/ui/overview/DashboardProgressBarCard"
// import { ChartCard } from "@/components/ui/overview/DashboardChartCard"
// import { Filterbar } from "@/components/ui/overview/DashboardFilterbar"
import { Filterbar } from "@/components/ui/overview/CustomFilterBar"
// import { overviews } from "@/data/overview-data"
// import { OverviewData } from "@/data/schema"
// import { cx } from "@/lib/utils"
import { subDays, toDate } from "date-fns"
import React, { useEffect } from "react"
import { DateRange } from "react-day-picker"
import { useProducts } from "@/hooks/useProducts"
import { useWorkspaceContext } from "@/context/WsContext"
import MepDashboard from "@/components/customs/MepDashboard"



// const overviewsDates = overviews.map((item) => toDate(item.date).getTime())
// const maxDate = toDate(Math.max(...overviewsDates))

const today = new Date()

function Overview() {
  const [selectedDates, setSelectedDates] = React.useState<
    DateRange | undefined
  >({
    from: new Date(2021, 0, 1),
    to: today,
  })

  const { products } = useProducts()
  const {
    workspace: data,
    activeProduct,
    setActiveProduct,
    fetchMarqueStats,
    firstStats,
    marqueList,
    fetchTopAnnonceur,
    topAnnonceur,
  } = useWorkspaceContext()
  const workspaceProductIds = data?.workspace?.products
  const filteredProducts =
    products?.filter((product) => workspaceProductIds?.includes(product.id)) ||
    []

  console.log("topAnnonceur", topAnnonceur)

  const elementSample =
    marqueList?.map((item: string) => ({
      title: item,
      value: item,
    })) || []

  // const elementSample = [];

  const [selectedElement, setSelectedElement] = React.useState<string>(
    elementSample[0]?.value || "Cliquer pour choisir",
  )

  React.useEffect(() => {
    if (filteredProducts.length > 0 && activeProduct === null) {
      setActiveProduct(filteredProducts[0])
    }
  }, [filteredProducts, activeProduct])

  useEffect(() => {
    if (selectedElement) {
      fetchMarqueStats(selectedElement, selectedDates?.from, selectedDates?.to)
      fetchTopAnnonceur(selectedDates?.from, selectedDates?.to)
    }
  }, [selectedElement, selectedDates])

  if (!activeProduct) {
    return (
      <div className="flex min-h-[50vh] flex-col gap-4">
        <div className="space-y-2 text-left">
          <div className="h-6 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="mt-8 grid w-full grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <section aria-labelledby="usage-overview">
        <h1
          id="usage-overview"
          className="scroll-mt-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50"
        >
          {activeProduct.name}
        </h1>
        <div className="sticky top-16 z-20 flex items-center justify-between border-b border-gray-200 bg-white pb-4 pt-4 sm:pt-6 lg:top-0 lg:mx-0 lg:px-0 lg:pt-8 dark:border-gray-800 dark:bg-gray-950">
          <Filterbar
            maxDate={today}
            minDate={new Date(2020, 0, 1)}
            selectedDates={selectedDates}
            onDatesChange={(dates) => setSelectedDates(dates)}
            elements={elementSample}
            selectedElement={selectedElement}
            onElementChange={(element) => setSelectedElement(element as string)}
          />
        </div>

        <MepDashboard datas={{ first: firstStats, top: topAnnonceur }} />
      </section>
    </>
  )
}

export default Overview

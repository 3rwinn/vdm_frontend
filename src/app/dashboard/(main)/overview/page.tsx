"use client"
import React, { useEffect, useState } from "react"
// import { useProducts } from "@/hooks/useProducts"
import { useWorkspaceContext } from "@/context/WsContext"
import { useRouter } from "next/navigation"
import MepChaineDashboard from "@/components/customs/MepChaineDashboard"

// const overviewsDates = overviews.map((item) => toDate(item.date).getTime())
// const maxDate = toDate(Math.max(...overviewsDates))

function formatDate(date: string | Date) {
  // return new Date(date).toISOString().split("T")[0]
  const year = date?.getFullYear()
  const month = String(date?.getMonth() + 1).padStart(2, "0")
  const day = String(date?.getDate()).padStart(2, "0")
  const hours = String(date?.getHours()).padStart(2, "0")
  const minutes = String(date?.getMinutes()).padStart(2, "0")
  const seconds = String(date?.getSeconds()).padStart(2, "0")
  const milliseconds = String(date?.getMilliseconds()).padStart(3, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

function Overview() {
  const router = useRouter()
  const { workspace, ddaChannel, fetchDdaChannel } = useWorkspaceContext()

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    // from: new Date("2020-01-01").toISOString().split("T")[0],
    // to: new Date().toISOString().split("T")[0],
    from: undefined,
    to: undefined,
  })

  const handleDateRangeChange = (dateRange: string) => {
    setDateRange(dateRange)
  }

  console.log("dateRange: ", dateRange)

  useEffect(() => {
    if (workspace) {
      fetchDdaChannel(
        workspace.sector_activity,
        workspace.id_client,
        dateRange.from
          ? formatDate(dateRange.from)
          : formatDate(new Date("2020-01-01")),
        dateRange.to ? formatDate(dateRange.to) : formatDate(new Date()),
        // dateRange.from,
        // dateRange.to,
      )
    }
  }, [workspace, dateRange])

  console.log("ddaChannel: ", ddaChannel)

  if (!workspace) {
    router.push("/onboarding")
  }

  return (
    <>
      <MepChaineDashboard
        datas={ddaChannel}
        workspace={workspace}
        dateRange={dateRange}
        handleDateRangeChange={handleDateRangeChange}
      />
    </>
  )
}

export default Overview

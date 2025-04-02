"use client"
import { columns } from "@/components/ui/data-table/columns"
import { DataTable } from "@/components/ui/data-table/DataTable"
import { useWorkspaceContext } from "@/context/WsContext"
import { usage } from "@/data/data"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DatasByChaineColumns } from "./customColumn"
import { DateRange } from "@/components/DatePicker"
import { useProducts } from "@/hooks/useProducts"

export default function Example() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  console.log("dateRange", dateRange)

  const {
    datasByChaines,
    workspace,
    fetchDatasByChaines,
    fetchDatasByChaineSector,
    getPigeReportLink,
    getPigeReportLinkAdvertiser,
    fetchDatasByAnnonceurSector,
  } = useWorkspaceContext()

  const { products } = useProducts()

  const product = products?.find((p) => workspace?.products?.includes(p.id))

  console.log("datasByChaines", datasByChaines)

  useEffect(() => {
    if (workspace?.id_client) {
      // fetchDatasByChaines(workspace?.id_client)
      if (product?.code === "METV" || product?.code === "MER") {
        fetchDatasByChaineSector(
          workspace?.id_client,
          workspace?.sector_activity,
        )
      } else if (product?.code === "MEP") {
        fetchDatasByAnnonceurSector(
          workspace?.id_client,
          workspace?.sector_activity,
        )
      }
    }
  }, [workspace, product])

  console.log("datasByChaines", datasByChaines)

  function handleExport() {
    if (product?.code === "METV" || product?.code === "MER") {
      const link = getPigeReportLink(
        workspace?.sector_activity,
        workspace?.id_client,
      )
      window.open(link, "_blank")
    } else if (product?.code === "MEP") {
      const link = getPigeReportLinkAdvertiser(
        workspace?.sector_activity,
        workspace?.id_client,
      )
      window.open(link, "_blank")
    }
  }

  if (!workspace) {
    router.push("/onboarding")
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
        Rapport
      </h1>
      <div className="mt-4 sm:mt-6 lg:mt-10">
        {/* <DataTable data={usage} columns={columns} /> */}
        <DataTable
          data={datasByChaines || []}
          columns={DatasByChaineColumns}
          useCustomFilterBar={true}
          exportFn={handleExport}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </div>
    </>
  )
}

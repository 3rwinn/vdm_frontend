"use client"
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useWorkspaceContext } from "@/context/WsContext"
import { useRouter } from "next/navigation"
import MepChaineDashboard from "@/components/customs/MepChaineDashboard"
import { useProducts } from "@/hooks/useProducts"
import MepDashboard from "@/components/customs/MepDashboard"

// Define types to fix linter errors
type ExtendedContext = {
  workspace: any;
  workspaces: any[];
  ddaChannel: any;
  mepAnalysis: any;
  fetchDdaChannel: (sector: string, client: string, from: string, to: string) => Promise<void>;
  fetchMepAnalysis: (client: string, from: string, to: string) => Promise<void>;
  [key: string]: any;
};

type ProductType = {
  id: number;
  code: string;
  [key: string]: any;
};

type DateRangeType = {
  from: Date;
  to: Date;
};

// Basic function to format dates
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

function Overview() {
  const router = useRouter()
  
  // Get context data with proper typing
  const context = useWorkspaceContext() as unknown as ExtendedContext
  const workspace = context.workspace
  
  // Get products
  const { products } = useProducts()
  
  // Basic state
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeType>({
    from: new Date("2020-01-01"),
    to: new Date()
  })
  
  // Use refs to track previous values and prevent unnecessary fetches
  const prevFetchParamsRef = useRef({
    workspaceId: '',
    productId: 0,
    fromTime: 0,
    toTime: 0
  })
  
  // Track if we've already fetched data
  const dataFetchedRef = useRef(false)
  
  // Extract stable primitive values for dependencies
  const workspaceId = workspace?.id || ''
  const productId = workspace?.products?.[0] || 0
  const fromTime = dateRange.from.getTime()
  const toTime = dateRange.to.getTime()
  
  // Find product with stable reference
  const product = useMemo(() => {
    if (!productId || !products?.length) return undefined
    return products.find(p => p.id === productId) as ProductType | undefined
  }, [productId, products])
  
  // Handle date change with proper typing and stable reference
  const handleDateRangeChange = useCallback((newRange: DateRangeType) => {
    setDateRange(newRange)
  }, [])
  
  // Format dates with stable references
  const fromFormatted = useMemo(() => formatDate(dateRange.from), [fromTime])
  const toFormatted = useMemo(() => formatDate(dateRange.to), [toTime])
  
  // Simple effect to fetch data with primitive dependencies
  useEffect(() => {
    // Skip if missing data
    if (!workspace || !product || !product.code) return
    
    // Check if we need to fetch new data by comparing with previous values
    const prevParams = prevFetchParamsRef.current
    const paramsChanged = 
      prevParams.workspaceId !== workspaceId ||
      prevParams.productId !== productId ||
      prevParams.fromTime !== fromTime ||
      prevParams.toTime !== toTime
    
    // Skip if params haven't changed and we've already fetched data
    if (!paramsChanged && dataFetchedRef.current) return
    
    // Update previous params
    prevFetchParamsRef.current = {
      workspaceId,
      productId,
      fromTime,
      toTime
    }
    
    // Set loading
    let mounted = true
    setIsLoading(true)
    
    // Load data
    const loadData = async () => {
      try {
        if (product.code === "METV" || product.code === "MER") {
          await context.fetchDdaChannel(
            workspace.sector_activity || '',
            workspace.id_client || '',
            fromFormatted,
            toFormatted
          )
        } else if (product.code === "MEP") {
          await context.fetchMepAnalysis(
            workspace.id_client || '',
            fromFormatted,
            toFormatted
          )
        }
        
        // Mark as fetched
        if (mounted) {
          dataFetchedRef.current = true
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Debounce
    const timer = setTimeout(loadData, 300)
    
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [workspaceId, productId, fromTime, toTime, fromFormatted, toFormatted, product?.code])
  
  // Redirect if no workspace
  if (!workspace) {
    router.push("/onboarding")
    return null
  }
  
  // Determine dashboard to show
  let dashboard = null
  
  if (product?.code === "METV" || product?.code === "MER") {
    dashboard = (
      <MepChaineDashboard
        mode={product?.code === "METV" ? "tv" : "radio"}
        datas={context.ddaChannel}
        workspace={workspace}
        dateRange={dateRange}
        handleDateRangeChange={handleDateRangeChange}
      />
    )
  } else if (product?.code === "MEP") {
    dashboard = (
      <MepDashboard
        data={context.mepAnalysis}
        workspace={{
          id_client: workspace.id_client || '',
          sector_activity: workspace.sector_activity
        }}
        dateRange={dateRange}
        handleDateRangeChange={handleDateRangeChange}
      />
    )
  }
  
  // Check if data is available
  const hasData = product?.code === "MEP" 
    ? !!context.mepAnalysis 
    : !!context.ddaChannel
  
  // Render
  return (
    <>
      {isLoading && !hasData ? (
        <div className="flex items-center justify-center h-full">
          <p>Chargement des données...</p>
        </div>
      ) : (
        dashboard || (
          <div className="flex items-center justify-center h-full">
            <p>Aucune donnée disponible pour le produit sélectionné.</p>
          </div>
        )
      )}
    </>
  )
}

export default Overview

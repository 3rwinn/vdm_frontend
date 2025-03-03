"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Workspace {
  id: number
  name: string
  owner: number
  subscription_start_date: string
  subscription_end_date: string
  products: number[]
  id_client?: string
  type_client?: string
  sector_activity?: string
}

interface WorkspaceContextType {
  workspace: Workspace | null
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  setWorkspace: (workspace: Workspace | null) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
)

interface WorkspaceContextTypeWithActiveProduct extends WorkspaceContextType {
  activeProduct: string | null
  setActiveProduct: (product: string | null) => void
}

const formatDate = (date: Date) => {
  return date.toISOString().slice(0, 19).replace("T", " ")
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const [activeProduct, setActiveProduct] = useState<String | null>(null)
  const [firstStats, setFirstStats] = useState<any | null>(null)
  const [marqueList, setMarqueList] = useState<string[] | null>(null)
  const [sectorList, setSectorList] = useState<string[]>([])
  const [chainesBySector, setChainesBySector] = useState<string[] | null>(null)
  const [marquesBySector, setMarquesBySector] = useState<string[] | null>(null)
  const [topAnnonceur, setTopAnnonceur] = useState<any | null>(null)
  const [ddaChannel, setDdaChannel] = useState<any | null>(null)
  const [datasByChaines, setDatasByChaines] = useState<any | null>(null)

  const fetchMarqueStats = async (
    marque: string,
    dateFrom: string,
    dateTo: string,
  ) => {
    // Convert Date objects to formatted strings

    const formattedDateFrom = formatDate(new Date(dateFrom))
    const formattedDateTo = formatDate(new Date(dateTo))

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/marque-stats/${marque}/date_from/${formattedDateFrom}/date_to/${formattedDateTo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("first stats", data)
        setFirstStats(data)
      } else {
        console.error("Error fetching marque stats:", response.statusText)
        return null
      }
    } catch (error) {
      console.error("Error fetching marque stats:", error)
      return null
    }
  }

  const fetchTopAnnonceur = async (dateFrom: string, dateTo: string) => {
    const formattedDateFrom = formatDate(new Date(dateFrom))
    const formattedDateTo = formatDate(new Date(dateTo))

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/top-annonceur/${formattedDateFrom}/${formattedDateTo}`,
        { method: "GET" },
      )
      if (response.ok) {
        const data = await response.json()
        console.log("top annonceur", data)
        setTopAnnonceur(data)
      } else {
        console.error("Error fetching top annonceur:", response.statusText)
        return null
      }
    } catch (error) {
      console.error("Error fetching top annonceur:", error)
      return null
    }
  }

  const fetchMarqueList = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/marques/`,
        { method: "GET" },
      )
      if (response.ok) {
        const data = await response.json()
        console.log("marque list", data)
        setMarqueList(data.marques)
      }
    } catch (error) {
      console.error("Error fetching marque list:", error)
      return null
    }
  }

  const fetchSectorList = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sectors/`,
        { method: "GET" },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("sector list", data)
        setSectorList(data.sectors)
      }
    } catch (error) {
      console.error("Error fetching sector list:", error)
      return null
    }
  }

  const fetchChainesBySector = async (sector: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chaines/${sector}`,
        { method: "GET" },
      )
      if (response.ok) {
        const data = await response.json()
        console.log("chaines by sector", data)
        setChainesBySector(data.chaines)
      }
    } catch (error) {
      console.error("Error fetching chaines by sector:", error)
      return null
    }
  }

  const fetchMarqueBySector = async (sector: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/marques/${sector}`,
        { method: "GET" },
      )
      if (response.ok) {
        const data = await response.json()
        console.log("marques by sector", data)
        setMarquesBySector(data.marques)
      }
    } catch (error) {
      console.error("Error fetching marques by sector:", error)
      return null
    }
  }

  const fetchDdaChannel = async (
    sector: string,
    channel: string,
    dateFrom?: string,
    dateTo?: string,
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dda/${sector}/${channel}/${dateFrom}/${dateTo}`,
        {
          method: "POST",
          body: JSON.stringify({ date_from: dateFrom, date_to: dateTo }),
        },
      )
      if (response.ok) {
        const results = await response.json()
        setDdaChannel(results.data)
      }
    } catch (error) {
      console.log("error fetch dda", error)
    }
  }

  function getPigeReportLink(sector: string, channel: string) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pige/${sector}/${channel}`
  }

  const fetchDatasByChaines = async (channel: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/datas/chaine/${channel}`,
        { method: "GET" },
      )
      if (response.ok) {
        const results = await response.json()
        console.log("datas by chaines", results)
        setDatasByChaines(results.datas)
      }
    } catch (error) {
      console.error("Error fetching datas by chaines:", error)
      // return null
    }
  }

  const fetchDatasByChaineSector = async (channel: string, sector: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/datas/chaine/${channel}/sector/${sector}`,
        { method: "GET" },
      )
      if (response.ok) {
        const results = await response.json()
        console.log("datas by chaines", results)
        setDatasByChaines(results.datas)
      }
    } catch (error) {
      console.error("Error fetch datas by chaines & sectors", error)
    }
  }

  useEffect(() => {
    async function checkWorkspace() {
      if (session?.user_data?.id) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${session.user_data.id}/workspace`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            },
          )

          console.log("checking current workspace request", response)

          if (response.ok) {
            const data = await response.json()
            setWorkspaces(data)
          }
        } catch (error) {
          console.error("Error fetching workspace:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    checkWorkspace()
    fetchMarqueList()
  }, [session])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        setWorkspaces,
        workspace,
        setWorkspace,
        isLoading,
        setActiveProduct,
        activeProduct: activeProduct as any,
        fetchMarqueStats,
        firstStats,
        fetchMarqueList,
        marqueList,
        fetchSectorList,
        sectorList,
        fetchChainesBySector,
        chainesBySector,
        fetchMarqueBySector,
        marquesBySector,
        fetchTopAnnonceur,
        topAnnonceur,
        fetchDdaChannel,
        ddaChannel,
        fetchDatasByChaines,
        fetchDatasByChaineSector,
        datasByChaines,
        getPigeReportLink,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider",
    )
  }
  return context
}

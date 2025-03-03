import { useState } from "react"

interface CreateWorkspaceParams {
  name: string
  owner: number
  products: number[]
  type_client?: string
  sector_activity?: string
  id_client?: string
  months: number
}

interface CreateWorkspaceResponse {
  id: number
  name: string
  owner: number
  subscription_start_date: string
  subscription_end_date: string
  products: number[]
  type_client?: string
  sector_activity?: string
  id_client?: string
}

export function useWorkspace() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [workspace, setWorkspace] = useState<CreateWorkspaceResponse | null>(
    null,
  )

  const checkUserWorkspace = async (userId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${userId}/workspace`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch user workspace")
      }

      const data: CreateWorkspaceResponse = await response.json()
      setWorkspace(data)
      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const createWorkspace = async ({
    name,
    owner,
    products,
    type_client,
    sector_activity,
    id_client,
    months,
  }: CreateWorkspaceParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const currentDate = new Date()
      const endDate = new Date(currentDate)
      endDate.setMonth(endDate.getMonth() + months)
      // endDate.setMonth(endDate.getMonth() + 1)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workspaces/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            owner,
            subscription_start_date: currentDate.toISOString(),
            subscription_end_date: endDate.toISOString(),
            is_active: true,
            products,
            type_client,
            sector_activity,
            id_client,
          }),
        },
      )

      console.log("response", response)

      if (!response.ok) {
        throw new Error("Failed to create workspace")
      }

      const data: CreateWorkspaceResponse = await response.json()
      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createWorkspace,
    checkUserWorkspace,
    isLoading,
    error,
  }
}

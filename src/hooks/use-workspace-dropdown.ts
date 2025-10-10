import { useEffect, useState } from "react"

import { fetchWorkspaces, type WorkspaceResponse } from "@/lib/api"
import {
  clearSelectedWorkspace,
  getStoredWorkspace,
  persistSelectedWorkspace,
  rememberWorkspaceId,
} from "@/lib/workspaces"

interface UseWorkspaceDropdownOptions {
  accessToken?: string
  initialWorkspace?: WorkspaceResponse | null
  workspaceId?: string
}

export function useWorkspaceDropdown({
  accessToken,
  initialWorkspace,
  workspaceId,
}: UseWorkspaceDropdownOptions) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceResponse | null>(() => {
    if (initialWorkspace) {
      return initialWorkspace
    }
    return getStoredWorkspace().workspace ?? null
  })
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialWorkspace) {
      persistSelectedWorkspace(initialWorkspace)
      setSelectedWorkspace(initialWorkspace)
    }
  }, [initialWorkspace])

  useEffect(() => {
    if (!accessToken) {
      setWorkspaces([])
      return
    }

    setLoading(true)
    fetchWorkspaces(accessToken)
      .then((data) => {
        setWorkspaces(data)

        const stored = getStoredWorkspace()
        if (workspaceId) {
          const match = data.find((workspace) => String(workspace.id) === workspaceId)
          if (match) {
            persistSelectedWorkspace(match)
            setSelectedWorkspace(match)
            return
          }
        }

        if (stored.workspaceId) {
          const match = data.find((workspace) => String(workspace.id) === stored.workspaceId)
          if (match) {
            setSelectedWorkspace(match)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [accessToken, workspaceId])

  const selectWorkspace = (workspace: WorkspaceResponse | null | undefined) => {
    if (workspace) {
      persistSelectedWorkspace(workspace)
      rememberWorkspaceId(workspace.id)
      setSelectedWorkspace(workspace)
    } else {
      clearSelectedWorkspace()
      setSelectedWorkspace(null)
    }
  }

  return { selectedWorkspace, selectWorkspace, workspaces, loading }
}

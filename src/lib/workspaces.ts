import type { WorkspaceResponse } from "@/lib/api"

export const SELECTED_WORKSPACE_STORAGE_KEY = "vdm.workspaces.selectedId"
export const SELECTED_WORKSPACE_DATA_KEY = "vdm.workspaces.selectedData"

export function persistSelectedWorkspace(workspace: WorkspaceResponse) {
  sessionStorage.setItem(SELECTED_WORKSPACE_STORAGE_KEY, String(workspace.id))
  sessionStorage.setItem(SELECTED_WORKSPACE_DATA_KEY, JSON.stringify(workspace))
}

export function rememberWorkspaceId(workspaceId: string | number) {
  sessionStorage.setItem(SELECTED_WORKSPACE_STORAGE_KEY, String(workspaceId))
}

export function getStoredWorkspace() {
  const workspaceId = sessionStorage.getItem(SELECTED_WORKSPACE_STORAGE_KEY)
  const raw = sessionStorage.getItem(SELECTED_WORKSPACE_DATA_KEY)
  let workspace: WorkspaceResponse | null = null

  if (raw) {
    try {
      workspace = JSON.parse(raw) as WorkspaceResponse
    } catch {
      sessionStorage.removeItem(SELECTED_WORKSPACE_DATA_KEY)
      workspace = null
    }
  }

  return { workspaceId, workspace }
}

export function clearSelectedWorkspace() {
  sessionStorage.removeItem(SELECTED_WORKSPACE_STORAGE_KEY)
  sessionStorage.removeItem(SELECTED_WORKSPACE_DATA_KEY)
}

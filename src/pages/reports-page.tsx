import { useEffect } from "react"
import { FileBarChart } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspaceDropdown } from "@/hooks/use-workspace-dropdown"
import { getStoredWorkspace } from "@/lib/workspaces"
import { paths } from "@/routes/paths"
import { cn } from "@/lib/utils"

export function ReportsPage() {
  const navigate = useNavigate()
  const { tokens } = useAuth()
  const { selectedWorkspace, selectWorkspace, workspaces, loading } = useWorkspaceDropdown({
    accessToken: tokens?.access,
  })

  useEffect(() => {
    const stored = getStoredWorkspace()
    if (!stored.workspaceId) {
      navigate(paths.workspaces, { replace: true })
      return
    }
    if (!selectedWorkspace && stored.workspace) {
      selectWorkspace(stored.workspace)
    }
  }, [navigate, selectWorkspace, selectedWorkspace])

  const workspaceLabel = selectedWorkspace?.name ?? "Aucun workspace sélectionné"

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#0c6e85]">Rapports en construction</p>
          <h1 className="text-3xl font-semibold text-foreground">Tableau des rapports</h1>
        </div>
        <div className="flex w-full items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:border-[#0c6e85]/40"
              >
                <span className="text-muted-foreground">Espace courant :</span>
                <span className="max-w-[220px] truncate font-semibold text-foreground">{workspaceLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              <DropdownMenuLabel>Vos espaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
              ) : workspaces.length === 0 ? (
                <DropdownMenuItem disabled>Aucun workspace disponible</DropdownMenuItem>
              ) : (
                workspaces.map((workspace) => {
                  const isActive = selectedWorkspace?.id === workspace.id
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onSelect={(event) => {
                        event.preventDefault()
                        selectWorkspace(workspace)
                      }}
                      className={cn(
                        "flex flex-col items-start gap-0.5",
                        isActive && "bg-[#0c6e85]/10 text-[#0c6e85] focus:bg-[#0c6e85]/10"
                      )}
                    >
                      <span className="text-sm font-semibold">{workspace.name}</span>
                      <span className="text-xs text-muted-foreground">{workspace.type_client ?? "Type d’organisation indéterminé"}</span>
                    </DropdownMenuItem>
                  )
                })
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  navigate(paths.workspaces)
                }}
              >
                Gérer mes workspaces
                <DropdownMenuShortcut>↗</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="mt-10">
        <Card className="flex flex-col items-center justify-center gap-4 rounded-3xl border-none bg-white p-12 text-center shadow-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
            <FileBarChart className="h-7 w-7 text-[#0c6e85]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Erreur de chargement des données.zqsawwwq</h2>
            <p className="text-sm text-muted-foreground">
              Nous préparons actuellement votre expérience rapports. Vous pourrez bientôt explorer des insights détaillés
              pour l’espace <span className="font-medium text-foreground">{workspaceLabel}</span>.
            </p>
          </div>
        </Card>
      </section>
    </DashboardShell>
  )
}

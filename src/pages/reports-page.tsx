import { useEffect, useState } from "react"
import { FileBarChart } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Card } from "@/components/ui/card"
import { getStoredWorkspace } from "@/lib/workspaces"
import { paths } from "@/routes/paths"

export function ReportsPage() {
  const navigate = useNavigate()
  const [workspaceName, setWorkspaceName] = useState<string>("")

  useEffect(() => {
    const stored = getStoredWorkspace()
    if (!stored.workspaceId) {
      navigate(paths.workspaces, { replace: true })
      return
    }
    setWorkspaceName(stored.workspace?.name ?? `Workspace #${stored.workspaceId}`)
  }, [navigate])

  return (
    <DashboardShell>
      <header className="space-y-2">
        <p className="text-sm font-medium text-[#0c6e85]">Rapports en construction</p>
        <h1 className="text-3xl font-semibold text-foreground">Tableau des rapports</h1>
        <p className="text-sm text-muted-foreground">Espace courant : <span className="font-semibold">{workspaceName}</span></p>
      </header>

      <section className="mt-10">
        <Card className="flex flex-col items-center justify-center gap-4 rounded-3xl border-none bg-white p-12 text-center shadow-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
            <FileBarChart className="h-7 w-7 text-[#0c6e85]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Les rapports arrivent bientôt</h2>
            <p className="text-sm text-muted-foreground">
              Nous préparons actuellement votre expérience rapports. Vous pourrez bientôt explorer des insights détaillés
              pour l’espace <span className="font-medium text-foreground">{workspaceName}</span>.
            </p>
          </div>
        </Card>
      </section>
    </DashboardShell>
  )
}

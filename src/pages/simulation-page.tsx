import { useEffect, useState } from "react"
import { BarChart3 } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Card } from "@/components/ui/card"
import { getStoredWorkspace } from "@/lib/workspaces"
import { paths } from "@/routes/paths"

export function SimulationPage() {
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
        <p className="text-sm font-medium text-[#0c6e85]">Simulation</p>
        <h1 className="text-3xl font-semibold text-foreground">Module de simulation</h1>
        <p className="text-sm text-muted-foreground">Espace courant : <span className="font-semibold">{workspaceName}</span></p>
      </header>

      <section className="mt-10">
        <Card className="flex flex-col items-center justify-center gap-4 rounded-3xl border-none bg-white p-12 text-center shadow-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
            <BarChart3 className="h-7 w-7 text-[#0c6e85]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Votre simulateur arrive bientôt</h2>
            <p className="text-sm text-muted-foreground">
              Préparez vos scénarios d’investissements médias et comparez l’impact des campagnes. La configuration pour
              <span className="font-medium text-foreground"> {workspaceName}</span> sera disponible très prochainement.
            </p>
          </div>
        </Card>
      </section>
    </DashboardShell>
  )
}


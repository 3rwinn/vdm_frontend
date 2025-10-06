import { useEffect, useState } from "react"
import { CalendarClock, Filter, LogOut, Menu, Sparkles, TrendingUp } from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { type WorkspaceResponse } from "@/lib/api"
import {
  clearSelectedWorkspace,
  getStoredWorkspace,
  persistSelectedWorkspace,
  rememberWorkspaceId,
} from "@/lib/workspaces"
import { buildPath, paths } from "@/routes/paths"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StatCardProps {
  title: string
  metric: string
  metaLabel: string
  gradient?: boolean
  recent: Array<{ channel: string; value: string; label?: string }>
}

function StatCard({ title, metric, metaLabel, gradient, recent }: StatCardProps) {
  return (
    <Card className="rounded-3xl border-none bg-white shadow-lg">
      <CardContent className="space-y-6 p-6">
        <div
          className={gradient
            ? "rounded-2xl bg-gradient-to-br from-[#0d7f93] via-[#0a617a] to-[#09455f] p-5 text-white"
            : "rounded-2xl bg-muted/40 p-5"}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">{title}</p>
              <p className="mt-2 text-3xl font-semibold">{metric}</p>
            </div>
            <Sparkles className="h-5 w-5 opacity-80" />
          </div>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{metaLabel}</p>
          <div className="space-y-3">
            {recent.map((item) => (
              <div key={`${item.channel}-${item.value}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
                    <CalendarClock className="h-5 w-5 text-[#0c6e85]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.channel}</p>
                    <p className="text-xs text-muted-foreground/70">{item.label ?? "Aujourd'hui, 16h36"}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const locationState = location.state as { workspace?: WorkspaceResponse } | null
  const workspaceFromState = locationState?.workspace

  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceResponse | null>(
    workspaceFromState ?? getStoredWorkspace().workspace ?? null
  )

  useEffect(() => {
    if (workspaceFromState) {
      persistSelectedWorkspace(workspaceFromState)
      setSelectedWorkspace(workspaceFromState)
      return
    }

    const stored = getStoredWorkspace()
    if (stored.workspace) {
      setSelectedWorkspace(stored.workspace)
    }
  }, [workspaceFromState])

  useEffect(() => {
    if (workspaceId) {
      if (workspaceFromState) {
        persistSelectedWorkspace(workspaceFromState)
      } else {
        rememberWorkspaceId(workspaceId)
      }
      return
    }

    const stored = getStoredWorkspace()
    if (stored.workspaceId) {
      navigate(buildPath.dashboard(stored.workspaceId), { replace: true })
    } else {
      navigate(paths.workspaces, { replace: true })
    }
  }, [workspaceId, workspaceFromState, navigate])

  const workspaceLabel = selectedWorkspace?.name ?? (workspaceId ? `Workspace #${workspaceId}` : "Aucun workspace sélectionné")

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#0c6e85]">Salut {user?.first_name ?? "Utilisateur"},</p>
          <h1 className="text-3xl font-semibold text-foreground">Bienvenue sur VDM !</h1>
          <p className="text-sm text-muted-foreground">
            Espace courant : <span className="font-semibold text-foreground">{workspaceLabel}</span>
          </p>
        </div>
        <div className="flex w-full items-center justify-end">
          <Button
            type="button"
            onClick={() => {
              logout()
              clearSelectedWorkspace()
              navigate(paths.login, { replace: true })
            }}
            className="flex items-center gap-2 rounded-full bg-[#0c6e85] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#0b6174]"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <section className="mt-10 flex flex-col gap-4 rounded-3xl bg-white p-4 shadow lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-full bg-[#0c6e85] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b6174]"
          >
            <Filter className="h-4 w-4" />
            Filtrer par
          </Button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-dashed border-muted-foreground/40 px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            Date
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border border-dashed border-[#f26a24] px-4 py-2 text-sm font-medium text-[#f26a24] transition hover:bg-[#f26a24]/10 md:flex"
          >
            Réinitialiser le filtre
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-dashed border-[#f26a24] px-4 py-2 text-sm font-medium text-[#f26a24] transition hover:bg-[#f26a24]/10 md:hidden"
        >
          Réinitialiser le filtre
        </button>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <StatCard
          title="Nombre de spot total"
          metric="5342"
          metaLabel="Récent"
          gradient
          recent={[
            { channel: "Radio", value: "771" },
            { channel: "RTI 1", value: "1937" },
          ]}
        />
        <StatCard
          title="Valorisation totale"
          metric="1 352 413 039 F CFA"
          metaLabel="Récent"
          gradient
          recent={[
            { channel: "Radio", value: "1 299 221 415 F CFA" },
            { channel: "RTI 1", value: "1 299 221 415 F CFA" },
          ]}
        />
        <StatCard
          title="Durée commerciale totale"
          metric="08 : 12 : 44 : 28"
          metaLabel="Récent"
          gradient
          recent={[
            { channel: "Radio", value: "08 : 12 : 44 : 28", label: "Aujourd'hui" },
            { channel: "RTI 1", value: "08 : 12 : 44 : 28", label: "23 juin, 13h06" },
          ]}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Nombre de spots / j</p>
              <p className="mt-2 text-4xl font-semibold text-foreground">682.5</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#0c6e85]">Spots</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="mr-1 h-4 w-4" /> +2.45%
            </span>
          </div>
          <div className="mt-6 flex items-end gap-2">
            {[48, 62, 45, 68, 52, 72, 65].map((value, index) => (
              <div key={index} className="flex-1">
                <div className="flex h-32 w-full items-end justify-center rounded-full bg-[#0c6e85]/10">
                  <div style={{ height: `${value}%` }} className="w-5 rounded-full bg-[#0c6e85]" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Heure de passage des spots</p>
              <p className="mt-4 text-6xl font-semibold text-[#f26a24]">27</p>
              <p className="text-lg font-semibold text-foreground">Septembre 2025</p>
            </div>
            <Button variant="ghost" className="rounded-full bg-[#fbe8dd] px-3 py-1 text-xs font-semibold text-[#f26a24]">
              <Sparkles className="mr-1 h-4 w-4" /> Journée clé
            </Button>
          </div>
          <div className="mt-8 flex flex-col gap-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>05:00</span>
              <span>10:00</span>
              <span>17:00</span>
              <span>20:00</span>
            </div>
            <div className="flex gap-2">
              {[35, 55, 80, 60].map((width, index) => (
                <div key={index} className="flex-1 rounded-full bg-[#0c6e85]/10">
                  <div style={{ width: `${width}%` }} className="h-2 rounded-full bg-[#0c6e85]" />
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Heure de passage des spots</p>
              <p className="mt-2 text-sm text-muted-foreground">Comparaison des valorisations</p>
            </div>
            <Button variant="ghost" className="rounded-full bg-[#fbe8dd] px-3 py-1 text-xs font-semibold text-[#f26a24]">
              <Sparkles className="mr-1 h-4 w-4" /> Valorisation
            </Button>
          </div>
          <div className="mt-6 h-48 w-full rounded-3xl bg-gradient-to-b from-white via-[#f5f8fb] to-[#eef3fb] p-4">
            <svg viewBox="0 0 300 160" className="h-full w-full">
              <path d="M10 120 C 70 60, 130 80, 190 40 S 270 80, 290 60" stroke="#f26a24" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M10 40 C 70 90, 130 110, 190 120 S 260 100, 290 130" stroke="#0c6e85" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
            <div className="mt-2 flex justify-end gap-4 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-[#f26a24]"><span className="h-2 w-2 rounded-full bg-[#f26a24]" /> Valorisation</span>
              <span className="inline-flex items-center gap-1 text-[#0c6e85]"><span className="h-2 w-2 rounded-full bg-[#0c6e85]" /> Valorisation</span>
            </div>
          </div>
        </Card>
      </section>

      <SectorAnalysisSection />
    </DashboardShell>
  )
}

const sectorOptions = [
  "Technologie",
  "Télécom",
  "Agro-industrie",
  "Banque",
]

const leaderboardData = [
  { name: "Groupe Carré d'Or", value: "54 0 232 215F CFA", delta: "+2.45%" },
  { name: "MIB MIBEM", value: "54 0 232 215F CFA", delta: "+2.45%" },
  { name: "Eurolait", value: "54 0 232 215F CFA", delta: "+2.45%" },
  { name: "Solibra", value: "54 0 232 215F CFA", delta: "+2.45%" },
  { name: "Brassivoir", value: "54 0 232 215F CFA", delta: "+2.45%" },
  { name: "Groupe Kirène", value: "54 0 232 215F CFA", delta: "+2.45%" },
]

function SectorAnalysisSection() {
  const [selectedSector, setSelectedSector] = useState<string>(sectorOptions[0])
  const [activeTab, setActiveTab] = useState<"spots" | "valorisations">("spots")

  return (
    <section className="mt-10 space-y-6">
      <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Analyse sectorielle</h2>
            <p className="text-sm text-muted-foreground">
              Visualisez la performance journalière de vos secteurs clés.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Secteur</span>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-56 rounded-full border border-border/70 bg-muted/30 text-sm font-medium text-foreground">
                <SelectValue placeholder="Choisir un secteur" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {sectorOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl bg-gradient-to-r from-[#0d7f93]/10 via-white to-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  Nombre de spots et valorisation par jour sur le secteur
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entrez dans cet univers créatif. Le secteur {selectedSector.toLowerCase()} nous inspire à innover.
                </p>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0c6e85]" /> Spots (bars)</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f26a24]" /> Valorisation</span>
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div className="flex h-40 items-end gap-3 rounded-2xl bg-white p-6 shadow-inner">
                  {[32, 48, 72, 54, 66, 52, 43].map((value, index) => (
                    <div key={index} className="flex-1">
                      <div className="flex h-full w-full items-end justify-center rounded-lg bg-[#0c6e85]/10">
                        <div className={`w-5 rounded-lg ${index === 2 ? "bg-[#f26a24]" : "bg-[#0c6e85]"}`} style={{ height: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  {["04-12-2024", "04-12-2024", "04-12-2024", "04-12-2024", "04-12-2024"].map((date, index) => (
                    <span key={`${date}-${index}`} className={index === 2 ? "font-semibold text-[#f26a24]" : ""}>
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-full flex-col justify-between gap-4 rounded-3xl bg-muted/30 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Valorisation (bars)</p>
              <ul className="space-y-1 text-sm text-foreground">
                {["2 400 000 F", "1 800 000 F", "1 200 000 F", "600 000 F", "0"].map((value) => (
                  <li key={value} className="flex items-center justify-between gap-3">
                    <span>{value}</span>
                    <span className="text-muted-foreground">CFA</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-4 text-sm text-muted-foreground shadow-sm">
              <p>
                Les performances sont calculées sur la semaine écoulée pour le secteur <span className="font-semibold text-foreground">{selectedSector.toLowerCase()}</span>.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Valorisation & nombre total de spots</p>
                <h3 className="text-lg font-semibold text-foreground">Vue sectorielle</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0c6e85]/10 px-3 py-1 text-xs font-semibold text-[#0c6e85]">
                Taux spots secteur <span className="text-foreground">10%</span>
              </span>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative flex h-48 w-48 items-center justify-center self-center rounded-full bg-[conic-gradient(#f26a24_0deg_110deg,#0c6e85_110deg_240deg,#f4f6fb_240deg_360deg)]">
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center text-xs font-medium text-muted-foreground">
                  <span className="text-base font-semibold text-foreground">11%</span>
                  <span>Taux valorisation</span>
                </div>
              </div>
              <div className="flex-1 space-y-4 text-sm text-muted-foreground">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#0c6e85]"><span className="h-2 w-2 rounded-full bg-[#0c6e85]" /> Nb spots secteur</span>
                    <span className="font-semibold text-foreground">7 215</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#f26a24]"><span className="h-2 w-2 rounded-full bg-[#f26a24]" /> Nb spots RTI</span>
                    <span className="font-semibold text-foreground">2 150</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#0c6e85]"><span className="h-2 w-2 rounded-full bg-[#0c6e85]" /> Valorisation secteur</span>
                    <span className="font-semibold text-foreground">54 0 232 215F CFA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#f26a24]"><span className="h-2 w-2 rounded-full bg-[#f26a24]" /> Valorisation RTI</span>
                    <span className="font-semibold text-foreground">232 215F CFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-none bg-white p-0 shadow-lg">
          <div className="rounded-t-3xl bg-gradient-to-r from-[#f8f1ea] via-[#f2f5f9] to-[#f8f1ea] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Classement des annonceurs</p>
                <h3 className="text-lg font-semibold text-foreground">Sur le lecteur</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/60 p-1 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 transition ${activeTab === "spots" ? "bg-white text-[#0c6e85] shadow" : "hover:bg-white/80"}`}
                  onClick={() => setActiveTab("spots")}
                >
                  Spots
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 transition ${activeTab === "valorisations" ? "bg-white text-[#0c6e85] shadow" : "hover:bg-white/80"}`}
                  onClick={() => setActiveTab("valorisations")}
                >
                  Valorisations
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-6 text-sm">
            {leaderboardData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm transition hover:border-[#0c6e85]/40"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{index + 1}. {item.name}</p>
                  <p className="text-base font-semibold text-foreground">{item.value}</p>
                </div>
                <span className="rounded-full bg-[#fbe8dd] px-3 py-1 text-xs font-semibold text-[#f26a24]">{item.delta}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}

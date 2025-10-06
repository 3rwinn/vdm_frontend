import { FormEvent, useEffect, useState } from "react"
import { Settings, User, Building2 } from "lucide-react"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { getStoredWorkspace } from "@/lib/workspaces"
import { toast } from "sonner"

interface ProfileFormState {
  firstName: string
  lastName: string
  email: string
}

export function SettingsPage() {
  const { user } = useAuth()
  const [formState, setFormState] = useState<ProfileFormState>({
    firstName: user?.first_name ?? "",
    lastName: user?.last_name ?? "",
    email: user?.email ?? "",
  })
  const [workspaceName, setWorkspaceName] = useState<string>("")
  const [workspaceDetails, setWorkspaceDetails] = useState({
    type: "—",
    channel: "—",
    plan: "—",
    products: "—",
  })

  useEffect(() => {
    setFormState({
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
      email: user?.email ?? "",
    })
  }, [user?.first_name, user?.last_name, user?.email])

  useEffect(() => {
    const stored = getStoredWorkspace()
    if (stored.workspaceId) {
      setWorkspaceName(stored.workspace?.name ?? `Workspace #${stored.workspaceId}`)
      if (stored.workspace) {
        setWorkspaceDetails({
          type: stored.workspace.type_client ?? "—",
          channel: stored.workspace.id_client ?? "—",
          plan: stored.workspace.paystack_subscription_plan ?? "Plan à définir",
          products:
            stored.workspace.products_details?.map((product) => product.name).join(", ") ?? "—",
        })
      }
    }
  }, [])

  const handleChange = (field: keyof ProfileFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast.success("Profil mis à jour localement.")
  }

  return (
    <DashboardShell>
      <header className="space-y-3">
        <p className="text-sm font-medium text-[#0c6e85]">Paramètre du compte</p>
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-foreground">
          <Settings className="h-6 w-6 text-[#0c6e85]" />
          Profil utilisateur
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles et l’espace de travail associé :
          <span className="ml-1 font-semibold text-foreground">{workspaceName || "Aucun workspace sélectionné"}</span>
        </p>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formState.firstName}
                onChange={handleChange("firstName")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formState.lastName}
                onChange={handleChange("lastName")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={handleChange("email")}
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" className="rounded-full bg-[#0c6e85] hover:bg-[#0b6174]">
                Mettre à jour
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-dashed"
                onClick={() => {
                  setFormState({
                    firstName: user?.first_name ?? "",
                    lastName: user?.last_name ?? "",
                    email: user?.email ?? "",
                  })
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
              <Building2 className="h-6 w-6 text-[#0c6e85]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Espace de travail</h2>
              <p className="text-sm text-muted-foreground">Informations principales synchronisées depuis votre sélection.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <div className="rounded-xl bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Nom</p>
              <p className="text-base font-semibold text-foreground">{workspaceName || "—"}</p>
            </div>
            <div className="rounded-xl bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Plan sélectionné</p>
              <p className="text-base font-semibold text-foreground">{workspaceDetails.plan}</p>
            </div>
            <div className="rounded-xl bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Type d’organisation</p>
              <p className="text-base text-foreground">{workspaceDetails.type}</p>
            </div>
            <div className="rounded-xl bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Chaîne suivie</p>
              <p className="text-base text-foreground">{workspaceDetails.channel}</p>
            </div>
            <div className="rounded-xl bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Produits</p>
              <p className="text-base text-foreground">{workspaceDetails.products}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
              <User className="h-6 w-6 text-[#0c6e85]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sécurité du compte</h2>
              <p className="text-sm text-muted-foreground">
                2FA, rotation de jetons et notifications d’activité seront bientôt configurables ici.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </DashboardShell>
  )
}

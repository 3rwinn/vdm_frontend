import { FormEvent, useEffect, useMemo, useState } from "react"
import { Settings, User, Building2, Trash2 } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspaceDropdown } from "@/hooks/use-workspace-dropdown"
import {
  clearSelectedWorkspace,
  getStoredWorkspace,
  persistSelectedWorkspace,
} from "@/lib/workspaces"
import { cn } from "@/lib/utils"
import { paths } from "@/routes/paths"
import { toast } from "sonner"
import { deleteWorkspace } from "@/lib/api"

interface ProfileFormState {
  firstName: string
  lastName: string
  email: string
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()
  const { selectedWorkspace, selectWorkspace, workspaces, loading } = useWorkspaceDropdown({
    accessToken: tokens?.access,
  })
  const [formState, setFormState] = useState<ProfileFormState>({
    firstName: user?.first_name ?? "",
    lastName: user?.last_name ?? "",
    email: user?.email ?? "",
  })
  const [workspaceDetails, setWorkspaceDetails] = useState({
    type: "—",
    channel: "—",
    plan: "—",
    products: "—",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setFormState({
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
      email: user?.email ?? "",
    })
  }, [user?.first_name, user?.last_name, user?.email])

  useEffect(() => {
    const stored = getStoredWorkspace()
    if (!stored.workspaceId) {
      navigate(paths.workspaces, { replace: true })
      return
    }

    if (!selectedWorkspace && stored.workspace) {
      persistSelectedWorkspace(stored.workspace)
      selectWorkspace(stored.workspace)
    }
  }, [selectedWorkspace, selectWorkspace, navigate])

  const workspaceName = useMemo(() => selectedWorkspace?.name ?? "Aucun workspace sélectionné", [selectedWorkspace])

  useEffect(() => {
    if (selectedWorkspace) {
      setWorkspaceDetails({
        type: selectedWorkspace.type_client ?? "—",
        channel: selectedWorkspace.id_client ?? "—",
        plan: selectedWorkspace.paystack_subscription_plan ?? "Plan à définir",
        products:
          selectedWorkspace.products_details?.map((product) => product.name).join(", ") ?? "—",
      })
    }
  }, [selectedWorkspace])

  const handleChange = (field: keyof ProfileFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast.success("Profil mis à jour localement.")
  }

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#0c6e85]">Paramètre du compte</p>
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-foreground">
            <Settings className="h-6 w-6 text-[#0c6e85]" />
            Profil utilisateur
          </h1>
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
                <span className="max-w-[220px] truncate font-semibold text-foreground">{workspaceName}</span>
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
          {selectedWorkspace ? (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer ce workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer « {workspaceName} » ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est définitive. Toutes les données associées à cet espace seront supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleting}
                    className="bg-[#e0552d] hover:bg-[#c94924]"
                    onClick={async (event) => {
                      event.preventDefault()
                      if (!selectedWorkspace || !tokens?.access) {
                        toast.error("Impossible de supprimer l’espace : session expirée")
                        return
                      }
                      try {
                        setDeleting(true)
                        await deleteWorkspace(selectedWorkspace.id, tokens.access)
                        toast.success("Workspace supprimé")
                        clearSelectedWorkspace()
                        selectWorkspace(undefined)
                        navigate(paths.workspaces, { replace: true })
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Suppression impossible")
                      } finally {
                        setDeleting(false)
                        setDeleteDialogOpen(false)
                      }
                    }}
                  >
                    {deleting ? "Suppression…" : "Supprimer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
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

import { useEffect, useMemo, useState } from "react"
import { Settings, User, BellRing, Building2, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

const notificationsMock = [
  {
    id: "notif-1",
    type: "info" as const,
    title: "Bienvenue sur VDM",
    description: "Découvrez les statistiques clés de votre premier workspace.",
    date: "Il y a 2 jours",
  },
  {
    id: "notif-2",
    type: "warning" as const,
    title: "Renouvellement d’abonnement",
    description: "Votre abonnement se renouvellera automatiquement dans 5 jours.",
    date: "Hier",
  },
  {
    id: "notif-3",
    type: "success" as const,
    title: "Nouvelles données disponibles",
    description: "Les données du panel TV du 10 février sont disponibles.",
    date: "Aujourd’hui",
  },
]

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

  const workspaceName = useMemo(
    () => selectedWorkspace?.name ?? "Aucun workspace sélectionné",
    [selectedWorkspace]
  )

  const handleChange = (field: keyof ProfileFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((previous) => ({ ...previous, [field]: event.target.value }))
    }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast.success("Profil mis à jour localement.")
  }

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace || !tokens?.access) return
    setDeleting(true)
    try {
      await deleteWorkspace(selectedWorkspace.id, tokens.access)
      toast.success("Workspace supprimé avec succès.")
      clearSelectedWorkspace()
      navigate(paths.workspaces)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le workspace pour le moment."
      )
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const workspaceMembers = useMemo(() => {
    return selectedWorkspace?.members ?? []
  }, [selectedWorkspace?.members])

  const subscriptionStart = selectedWorkspace?.subscription_start_date
    ? new Date(selectedWorkspace.subscription_start_date)
    : null
  const subscriptionEnd = selectedWorkspace?.subscription_end_date
    ? new Date(selectedWorkspace.subscription_end_date)
    : null

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#0c6e85]">Paramètres du compte</p>
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-foreground">
            <Settings className="h-6 w-6 text-[#0c6e85]" />
            Centre de configuration
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
                        selectWorkspace(workspace)
                      }}
                      className={cn(
                        "flex flex-col items-start gap-0.5",
                        isActive && "bg-[#0c6e85]/10 text-[#0c6e85] focus:bg-[#0c6e85]/10"
                      )}
                    >
                      <span className="text-sm font-semibold">{workspace.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {workspace.type_client ?? "Type d’organisation indéterminé"}
                      </span>
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

      <Tabs defaultValue="profile" className="mt-8 space-y-6">
        <TabsList className="w-full justify-start gap-2 rounded-2xl border border-border/60 bg-white py-6 px-2 shadow-sm">
          <TabsTrigger
            value="profile"
            className="rounded-xl px-4 py-4 text-sm transition focus-visible:outline-none data-[state=active]:bg-[#0c6e85] data-[state=active]:text-white data-[state=active]:shadow"
          >
            <User className="mr-2 h-4 w-4" /> Profil
          </TabsTrigger>
          <TabsTrigger
            value="workspace"
            className="rounded-xl px-4 py-4 text-sm transition focus-visible:outline-none data-[state=active]:bg-[#0c6e85] data-[state=active]:text-white data-[state=active]:shadow"
          >
            <Building2 className="mr-2 h-4 w-4" /> Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-none bg-white shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour les informations liées à votre compte utilisateur.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange("email")}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" className="bg-[#0c6e85] text-white hover:bg-[#0a5a6c]">
                  Enregistrer les changements
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-none bg-white shadow-lg">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Vos alertes et informations importantes récemment reçues.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#0c6e85]/30 text-[#0c6e85]">
                {notificationsMock.length} nouvelles
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationsMock.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            notification.type === "warning"
                              ? "warning"
                              : notification.type === "success"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {notification.type === "warning"
                            ? "Alerte"
                            : notification.type === "success"
                            ? "Info"
                            : "Message"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {notification.date}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                    <BellRing className="h-5 w-5 text-[#0c6e85]" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          {!selectedWorkspace ? (
            <Card className="border-none bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Aucun workspace actif</CardTitle>
                <CardDescription>
                  Sélectionnez un workspace pour accéder aux informations détaillées et gérer les membres.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card className="border-none bg-white shadow-lg">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      {selectedWorkspace.name}
                    </CardTitle>
                    <CardDescription>
                      Type : {selectedWorkspace.type_client ?? "—"} · Produit(s) :
                      {" "}
                      {selectedWorkspace.products_details?.map((product) => product.name).join(", ") ?? "—"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-[#0c6e85]/30 text-[#0c6e85]">
                      {selectedWorkspace.paystack_subscription_status ?? "Statut inconnu"}
                    </Badge>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer le workspace
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {selectedWorkspace.name} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Toutes les données associées à ce workspace seront supprimées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteWorkspace}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={deleting}
                          >
                            {deleting ? "Suppression..." : "Supprimer"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InfoTile label="Identifiant client" value={selectedWorkspace.id_client ?? "—"} />
                  <InfoTile
                    label="Abonnement"
                    value={selectedWorkspace.paystack_subscription_plan ?? "Plan à définir"}
                  />
                  <InfoTile
                    label="Début de période"
                    value={subscriptionStart ? subscriptionStart.toLocaleDateString("fr-FR") : "—"}
                  />
                  <InfoTile
                    label="Fin de période"
                    value={subscriptionEnd ? subscriptionEnd.toLocaleDateString("fr-FR") : "—"}
                  />
                </CardContent>
              </Card>

              <Card className="border-none bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>Membres du workspace</CardTitle>
                  <CardDescription>
                    Consultez la liste des utilisateurs associés à ce workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workspaceMembers.length === 0 ? (
                    <Alert>
                      <AlertTitle>Aucun membre</AlertTitle>
                      <AlertDescription>
                        Invitez vos collaborateurs pour collaborer autour des données.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workspaceMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.first_name} {member.last_name}
                              </TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-[#0c6e85]/30 text-[#0c6e85]">
                                  {member.role ?? "Membre"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

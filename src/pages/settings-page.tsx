import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  cancelWorkspaceInvitation,
  deleteWorkspace,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  resendWorkspaceInvitation,
  type WorkspaceInvitationResponse,
  type WorkspaceMemberResponse,
} from "@/lib/api"

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
    title: "Renouvellement d'abonnement",
    description: "Votre abonnement se renouvellera automatiquement dans 5 jours.",
    date: "Hier",
  },
  {
    id: "notif-3",
    type: "success" as const,
    title: "Nouvelles données disponibles",
    description: "Les données du panel TV du 10 février sont disponibles.",
    date: "Aujourd'hui",
  },
]

// Helper function to translate role names from English to French
function translateRole(role: string | null | undefined): string {
  if (!role) return "Membre"
  const roleLower = role.toLowerCase()
  switch (roleLower) {
    case "owner":
      return "Propriétaire"
    case "member":
      return "Membre"
    default:
      return role
  }
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [memberForm, setMemberForm] = useState({
    email: "",
    role: "member",
  })
  const [memberBeingRemoved, setMemberBeingRemoved] = useState<number | null>(null)
  const [resendingInvitationId, setResendingInvitationId] = useState<number | null>(null)
  const [cancellingInvitationId, setCancellingInvitationId] = useState<number | null>(null)
  const [cancelDialogId, setCancelDialogId] = useState<number | null>(null)

  const updateSelectedWorkspace = useCallback(
    (
      updater: (
        workspace: typeof selectedWorkspace
      ) => typeof selectedWorkspace,
    ) => {
      if (!selectedWorkspace) {
        return
      }
      const updated = updater(selectedWorkspace)
      if (updated) {
        selectWorkspace(updated)
      }
    },
    [selectedWorkspace, selectWorkspace],
  )

  const handleMemberFormChange = useCallback(
    <K extends keyof typeof memberForm>(field: K, value: (typeof memberForm)[K]) => {
      setMemberForm((previous) => ({ ...previous, [field]: value }))
    },
    [],
  )

  const handleInviteMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedWorkspace || !tokens?.access) {
      return
    }

    setMemberError(null)
    setInviting(true)

    try {
      const response = await inviteWorkspaceMember(
        selectedWorkspace.id,
        {
          email: memberForm.email.trim().toLowerCase(),
          role: memberForm.role.trim() || "member",
        },
        tokens.access,
      )

      updateSelectedWorkspace((workspace) => {
        if (!workspace) return workspace
        const invitations = workspace.invitations ?? []

        if ("status" in response) {
          const invitation = response as WorkspaceInvitationResponse
          const updatedInvitations = [
            invitation,
            ...invitations.filter(
              (existing) => existing.id !== invitation.id,
            ),
          ]
          return { ...workspace, invitations: updatedInvitations }
        }

        const member = response as WorkspaceMemberResponse
        const members = workspace.members ?? []
        const updatedMembers = [
          ...members.filter((existing) => existing.id !== member.id),
          member,
        ]
        const filteredInvitations = invitations.filter(
          (invitation) => invitation.email.toLowerCase() !== member.email.toLowerCase(),
        )
        return { ...workspace, members: updatedMembers, invitations: filteredInvitations }
      })

      setMemberForm({ email: "", role: memberForm.role })
      toast.success("Invitation envoyée ou membre ajouté avec succès.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'ajouter ce membre."
      setMemberError(message)
      toast.error(message)
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedWorkspace || !tokens?.access) {
      return
    }

    setMemberBeingRemoved(memberId)
    try {
      await removeWorkspaceMember(selectedWorkspace.id, memberId, tokens.access)
      updateSelectedWorkspace((workspace) => {
        if (!workspace) return workspace
        const filteredMembers = workspace.members.filter((member) => member.id !== memberId)
        return { ...workspace, members: filteredMembers }
      })
      toast.success("Membre supprimé avec succès.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer ce membre."
      toast.error(message)
    } finally {
      setMemberBeingRemoved(null)
    }
  }

  const handleResendInvitation = async (invitationId: number) => {
    if (!selectedWorkspace || !tokens?.access) {
      return
    }

    setResendingInvitationId(invitationId)
    try {
      const invitation = await resendWorkspaceInvitation(
        selectedWorkspace.id,
        invitationId,
        tokens.access,
      )
      updateSelectedWorkspace((workspace) => {
        if (!workspace) return workspace
        const invitations = workspace.invitations ?? []
        const hasInvitation = invitations.some((existing) => existing.id === invitation.id)
        const updatedInvitations = hasInvitation
          ? invitations.map((existing) => (existing.id === invitation.id ? invitation : existing))
          : [invitation, ...invitations]
        return { ...workspace, invitations: updatedInvitations }
      })
      toast.success("Invitation renvoyée avec succès.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de renvoyer l'invitation."
      toast.error(message)
    } finally {
      setResendingInvitationId(null)
    }
  }

  const handleCancelInvitation = async () => {
    if (!selectedWorkspace || !tokens?.access || cancelDialogId === null) {
      setCancelDialogId(null)
      return
    }

    setCancellingInvitationId(cancelDialogId)
    try {
      const cancelledInvitation = await cancelWorkspaceInvitation(selectedWorkspace.id, cancelDialogId, tokens.access)
      updateSelectedWorkspace((workspace) => {
        if (!workspace) return workspace
        const invitations = workspace.invitations ?? []
        // Update the invitation with the cancelled response, or remove it
        // The filter in workspaceInvitations memo will hide it from display
        const updatedInvitations = invitations.map((invitation) =>
          invitation.id === cancelDialogId ? cancelledInvitation : invitation
        )
        return { ...workspace, invitations: updatedInvitations }
      })
      toast.success("Invitation annulée.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'annuler l'invitation."
      toast.error(message)
    } finally {
      setCancellingInvitationId(null)
      setCancelDialogId(null)
    }
  }

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

  const workspaceInvitations = useMemo(() => {
    const invitations = selectedWorkspace?.invitations ?? []
    // Filter out cancelled/expired/accepted invitations to prevent display bugs
    return invitations.filter(
      (inv) => inv.status === "pending" && inv.is_active
    )
  }, [selectedWorkspace?.invitations])

  const subscriptionStart = selectedWorkspace?.subscription_start_date
    ? new Date(selectedWorkspace.subscription_start_date)
    : null
  const subscriptionEnd = selectedWorkspace?.subscription_end_date
    ? new Date(selectedWorkspace.subscription_end_date)
    : null

  return (
    <DashboardShell>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c6e85] via-[#0c6e85] to-[#0a5a6c] p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMS4xLjktMiAyLTJzMiAuOSAyIDItLjkgMi0yIDItMi0uOS0yLTJ6bTAgMjBjMC0xLjEuOS0yIDItMnMyIC45IDIgMi0uOSAyLTIgMi0yLS45LTItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Settings className="h-3.5 w-3.5" />
              Paramètres
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">
              Centre de configuration
            </h1>
            <p className="text-sm text-white/80">
              Gérez votre profil, workspace et préférences
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-2 rounded-xl border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/30"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="max-w-[200px] truncate font-semibold">{workspaceName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 rounded-xl border-border/50 bg-white/95 backdrop-blur-xl">
                <DropdownMenuLabel className="text-sm font-semibold">Vos espaces de travail</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                  <DropdownMenuItem disabled className="py-3">Chargement…</DropdownMenuItem>
                ) : workspaces.length === 0 ? (
                  <DropdownMenuItem disabled className="py-3">Aucun workspace disponible</DropdownMenuItem>
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
                          "flex flex-col items-start gap-1 rounded-lg py-3 transition-all",
                          isActive && "bg-[#0c6e85]/10 text-[#0c6e85] font-medium"
                        )}
                      >
                        <span className="text-sm font-semibold">{workspace.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {workspace.type_client ?? "Type d'organisation indéterminé"}
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
                  className="py-3 font-medium text-[#0c6e85]"
                >
                  Gérer mes workspaces
                  <DropdownMenuShortcut>↗</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="inline-flex h-auto gap-2 rounded-2xl bg-white p-1.5 backdrop-blur-sm">
          <TabsTrigger
            value="profile"
            className="rounded-xl px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-[#0c6e85] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0c6e85]/20"
          >
            <User className="mr-2 h-4 w-4" /> Profil
          </TabsTrigger>
          <TabsTrigger
            value="workspace"
            className="rounded-xl px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-[#0c6e85] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0c6e85]/20"
          >
            <Building2 className="mr-2 h-4 w-4" /> Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
          <Card className="overflow-hidden border border-border/50 bg-white shadow-xl pt-0">
            <form className="space-y-0" onSubmit={handleSubmit}>
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-[#0c6e85]/5 to-transparent pt-6 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0c6e85]/10">
                    <User className="h-6 w-6 text-[#0c6e85]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Informations personnelles</CardTitle>
                    <CardDescription className="mt-1">
                      Mettez à jour les informations liées à votre compte utilisateur
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    value={formState.firstName}
                    onChange={handleChange("firstName")}
                    required
                    className="rounded-xl border-border/60 transition-all focus:border-[#0c6e85] focus:ring-[#0c6e85]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    value={formState.lastName}
                    onChange={handleChange("lastName")}
                    required
                    className="rounded-xl border-border/60 transition-all focus:border-[#0c6e85] focus:ring-[#0c6e85]/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange("email")}
                    required
                    className="rounded-xl border-border/60 transition-all focus:border-[#0c6e85] focus:ring-[#0c6e85]/20"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 bg-muted/20 px-6 py-4">
                <Button
                  type="submit"
                  className="ml-auto rounded-xl bg-[#0c6e85] px-6 py-2.5 text-white shadow-lg shadow-[#0c6e85]/20 transition-all hover:bg-[#0a5a6c] hover:shadow-xl"
                >
                  Enregistrer les changements
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="overflow-hidden border border-border/50 bg-white shadow-xl pt-0">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-[#0c6e85]/5 to-transparent pb-6 pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0c6e85]/10">
                    <BellRing className="h-6 w-6 text-[#0c6e85]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notifications</CardTitle>
                    <CardDescription className="mt-1">
                      Vos alertes et informations importantes récemment reçues
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit border-[#0c6e85]/30 bg-[#0c6e85]/5 text-[#0c6e85] px-3 py-1">
                  {notificationsMock.length} nouvelles
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {notificationsMock.map((notification) => (
                <div
                  key={notification.id}
                  className="group rounded-xl border border-border/60 bg-gradient-to-br from-muted/30 to-muted/10 p-4 transition-all hover:border-[#0c6e85]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            notification.type === "warning"
                              ? "warning"
                              : notification.type === "success"
                              ? "success"
                              : "secondary"
                          }
                          className="text-xs"
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0c6e85]/10 transition-all group-hover:bg-[#0c6e85]/20">
                      <BellRing className="h-5 w-5 text-[#0c6e85]" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-8">
          {!selectedWorkspace ? (
            <Card className="overflow-hidden border border-border/50 bg-white shadow-xl">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-[#0c6e85]/5 to-transparent pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0c6e85]/10">
                    <Building2 className="h-6 w-6 text-[#0c6e85]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Aucun workspace actif</CardTitle>
                    <CardDescription className="mt-1">
                      Sélectionnez un workspace pour accéder aux informations détaillées et gérer les membres
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden border border-border/50 bg-white shadow-xl pt-0">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-[#0c6e85]/5 to-transparent pb-6 pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0c6e85]/10">
                        <Building2 className="h-6 w-6 text-[#0c6e85]" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold text-foreground">
                          {selectedWorkspace.name}
                        </CardTitle>
                        <CardDescription>
                          Type : {selectedWorkspace.type_client ?? "—"} · Produit(s) :
                          {" "}
                          {selectedWorkspace.products_details?.map((product) => product.name).join(", ") ?? "—"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="border-[#0c6e85]/30 bg-[#0c6e85]/5 text-[#0c6e85] px-3 py-1">
                        {selectedWorkspace.paystack_subscription_status ?? "Statut inconnu"}
                      </Badge>
                      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer {selectedWorkspace.name} ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Toutes les données associées à ce workspace seront supprimées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteWorkspace}
                              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                              disabled={deleting}
                            >
                              {deleting ? "Suppression..." : "Supprimer"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 p-6 md:grid-cols-2">
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

              <Card className="overflow-hidden border border-border/50 bg-white shadow-xl pt-0">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-[#0c6e85]/5 to-transparent pb-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0c6e85]/10">
                      <User className="h-6 w-6 text-[#0c6e85]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Gestion des membres</CardTitle>
                      <CardDescription className="mt-1">
                        Invitez de nouveaux collaborateurs et ajustez la liste existante
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <form className="rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 p-4" onSubmit={handleInviteMember}>
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor="member-email" className="text-sm font-medium">
                          Email du membre
                        </Label>
                        <Input
                          id="member-email"
                          type="email"
                          value={memberForm.email}
                          onChange={(event) => handleMemberFormChange("email", event.target.value)}
                          required
                          placeholder="membre@entreprise.com"
                          className="rounded-xl mt-2 border-border/60 transition-all focus:border-[#0c6e85] focus:ring-[#0c6e85]/20"
                        />
                      </div>
                      <div className="space-y-2 hidden">
                        <Label htmlFor="member-role">Rôle</Label>
                        <Input
                          id="member-role"
                          value={memberForm.role}
                          onChange={(event) => handleMemberFormChange("role", event.target.value)}
                          required
                          type="hidden"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="submit"
                          className="h-10 rounded-xl bg-[#0c6e85] px-6 text-white shadow-lg shadow-[#0c6e85]/20 transition-all hover:bg-[#0a5a6c] hover:shadow-xl"
                          disabled={inviting}
                        >
                          {inviting ? "Envoi..." : "Inviter"}
                        </Button>
                      </div>
                    </div>
                    {memberError ? (
                      <p className="mt-3 text-sm font-medium text-destructive">{memberError}</p>
                    ) : null}
                  </form>

                  {workspaceMembers.length === 0 ? (
                    <Alert className="border-dashed border-[#0c6e85]/30 bg-[#0c6e85]/5">
                      <User className="h-4 w-4 text-[#0c6e85]" />
                      <AlertTitle className="text-[#0c6e85]">Aucun membre</AlertTitle>
                      <AlertDescription>
                        Invitez vos collaborateurs pour collaborer autour des données
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Nom</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Rôle</TableHead>
                            <TableHead className="w-24 text-right font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workspaceMembers.map((member) => {
                            const isOwner = member.email.toLowerCase() === selectedWorkspace.owner?.email?.toLowerCase()
                            return (
                              <TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="font-medium">
                                  {member.first_name} {member.last_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-[#0c6e85]/30 bg-[#0c6e85]/5 text-[#0c6e85]">
                                    {translateRole(member.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    disabled={isOwner || memberBeingRemoved === member.id}
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    {memberBeingRemoved === member.id ? "Suppression..." : "Retirer"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border border-border/50 bg-white shadow-xl pt-0">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-[#0c6e85]/5 to-transparent pb-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0c6e85]/10">
                      <BellRing className="h-6 w-6 text-[#0c6e85]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Invitations en attente</CardTitle>
                      <CardDescription className="mt-1">
                        Ces membres doivent encore finaliser leur inscription via le lien reçu
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {workspaceInvitations.length === 0 ? (
                    <Alert className="border-dashed border-[#0c6e85]/30 bg-[#0c6e85]/5">
                      <BellRing className="h-4 w-4 text-[#0c6e85]" />
                      <AlertTitle className="text-[#0c6e85]">Aucune invitation en attente</AlertTitle>
                      <AlertDescription>
                        Toutes les invitations ont été acceptées ou expirées
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Rôle</TableHead>
                            <TableHead className="font-semibold">Statut</TableHead>
                            <TableHead className="font-semibold">Expire le</TableHead>
                            <TableHead className="font-semibold">Invité·e par</TableHead>
                            <TableHead className="w-[220px] text-right font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workspaceInvitations.map((invitation) => {
                            const isResending = resendingInvitationId === invitation.id
                            const isCancelling = cancellingInvitationId === invitation.id
                            const inviterLabel = invitation.invited_by
                              ? `${invitation.invited_by.first_name} ${invitation.invited_by.last_name}`.trim() || invitation.invited_by.email
                              : "—"

                            return (
                              <TableRow key={invitation.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="font-medium">{invitation.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-[#0c6e85]/30 bg-[#0c6e85]/5 text-[#0c6e85]">
                                    {translateRole(invitation.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                                    En attente
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(invitation.expires_at).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{inviterLabel}</TableCell>
                                <TableCell className="space-x-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-lg text-[#0c6e85] hover:bg-[#0c6e85]/10 hover:text-[#0c6e85]"
                                    disabled={isResending || isCancelling}
                                    onClick={() => handleResendInvitation(invitation.id)}
                                  >
                                    {isResending ? "Renvoi..." : "Renvoyer"}
                                  </Button>
                                  <AlertDialog
                                    open={cancelDialogId === invitation.id}
                                    onOpenChange={(open) => setCancelDialogId(open ? invitation.id : null)}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        disabled={isCancelling}
                                      >
                                        Annuler
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Annuler cette invitation ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          L'invité·e ne pourra plus rejoindre le workspace via ce lien. Vous pourrez renvoyer une nouvelle invitation plus tard.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isCancelling} className="rounded-xl">
                                          Retour
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={handleCancelInvitation}
                                          disabled={isCancelling}
                                          className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                                        >
                                          {isCancelling ? "Annulation..." : "Confirmer"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            )
                          })}
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
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-5 transition-all hover:border-[#0c6e85]/30 hover:shadow-md">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#0c6e85]/5 blur-2xl transition-all group-hover:bg-[#0c6e85]/10"></div>
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

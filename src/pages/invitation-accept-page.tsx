import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ShieldCheck, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import {
  acceptInvitation,
  fetchInvitationDetail,
  type AcceptInvitationPayload,
  type AcceptInvitationResponse,
  type InvitationDetailResponse,
  type VerifyResponse,
} from "@/lib/api"
import { rememberWorkspaceId } from "@/lib/workspaces"
import { buildPath, paths } from "@/routes/paths"

interface InvitationFormState {
  first_name: string
  last_name: string
  password: string
  confirm: string
}

// Helper function to translate role names from English to French
function translateRole(role: string | null | undefined): string {
  if (!role) return "membre"
  const roleLower = role.toLowerCase()
  switch (roleLower) {
    case "owner":
      return "propriétaire"
    case "member":
      return "membre"
    default:
      return role
  }
}

export function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { authenticate } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationDetailResponse | null>(null)
  const [formState, setFormState] = useState<InvitationFormState>({
    first_name: "",
    last_name: "",
    password: "",
    confirm: "",
  })

  useEffect(() => {
    if (!token) {
      setError("Lien d'invitation invalide.")
      setLoading(false)
      return
    }

    fetchInvitationDetail(token)
      .then((response) => {
        setInvitation(response)
        setLoading(false)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Invitation invalide ou expirée."
        setError(message)
        setLoading(false)
      })
  }, [token])

  const handleChange = (field: keyof InvitationFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !invitation) {
      return
    }

    if (formState.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    if (formState.password !== formState.confirm) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }

    const payload: AcceptInvitationPayload = {
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      password: formState.password,
    }

    if (!payload.first_name || !payload.last_name) {
      toast.error("Veuillez renseigner votre prénom et votre nom.")
      return
    }

    setSubmitting(true)

    try {
      const response: AcceptInvitationResponse = await acceptInvitation(token, payload)
      const authPayload: VerifyResponse = {
        access: response.access,
        refresh: response.refresh,
        user_data: response.user,
      }
      authenticate(authPayload)
      rememberWorkspaceId(response.workspace_id)
      toast.success("Bienvenue ! Votre compte est prêt.")
      navigate(buildPath.dashboard(response.workspace_id), { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de finaliser l'invitation."
      toast.error(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4 py-10">
      <Card className="w-full max-w-lg border-none bg-white shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0c6e85]/10">
            {error ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-[#0c6e85]" />
            )}
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            {error ? "Invitation invalide" : "Rejoindre le workspace"}
          </CardTitle>
          <CardDescription>
            {error
              ? error
              : loading
              ? "Validation de votre invitation en cours..."
              : `Complétez votre profil pour accéder à ${invitation?.workspace.name}.`}
          </CardDescription>
        </CardHeader>

        {!error && !loading && invitation ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Email invité</Label>
                <Input value={invitation.email} disabled readOnly className="bg-muted" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={formState.first_name}
                    onChange={(event) => handleChange("first_name", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={formState.last_name}
                    onChange={(event) => handleChange("last_name", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formState.password}
                    onChange={(event) => handleChange("password", event.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={formState.confirm}
                    onChange={(event) => handleChange("confirm", event.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-[#0c6e85]/30 bg-[#0c6e85]/5 p-4 text-sm text-muted-foreground">
                Vous allez rejoindre <span className="font-semibold text-[#0c6e85]">{invitation.workspace.name}</span> avec le rôle
                <span className="font-semibold text-[#0c6e85]"> {translateRole(invitation.role)}</span>.
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-[#0c6e85] text-white hover:bg-[#0a5a6c]"
                disabled={submitting}
              >
                {submitting ? "Création en cours..." : "Créer mon compte"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                En poursuivant, vous acceptez les conditions d'utilisation de VDM.
              </p>
            </CardFooter>
          </form>
        ) : null}

        {error && (
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(paths.login)}
            >
              Retourner à l'accueil
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

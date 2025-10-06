import { Formik, Form } from "formik"
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { CodeInput, isCodeComplete } from "@/components/auth/code-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { paths } from "@/routes/paths"
import { toast } from "sonner"

interface LocationState {
  email?: string
  notice?: string
}

export function VerifyCodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyCode, requestCode, pendingEmail } = useAuth()

  const locationState = location.state as LocationState | null

  const initialEmail = useMemo(() => {
    const stateEmail = locationState?.email
    return stateEmail ?? pendingEmail ?? ""
  }, [locationState?.email, pendingEmail])

  const email = initialEmail
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (locationState?.notice) {
      toast.success(locationState.notice, { duration: 4200 })
    }
  }, [locationState?.notice])

  const subtitle = email
    ? `Renseignez le code reçu à l'adresse ${email}.`
    : "Saisissez le code à 6 chiffres envoyé sur votre adresse email."

  return (
    <AuthPageLayout title="Valider le code" subtitle={subtitle} accent="teal">
      <Formik
        initialValues={{ code: "" }}
        validate={(values) => {
          const errors: { code?: string } = {}
          if (!isCodeComplete(values.code)) {
            errors.code = "Saisissez les 6 chiffres reçus."
          }
          return errors
        }}
        onSubmit={async (values, helpers) => {
          const submittedEmail = email.trim().toLowerCase()
          if (!submittedEmail) {
            toast.error("Adresse email manquante")
            helpers.setSubmitting(false)
            return
          }

          const sanitizedCode = values.code.replace(/[^0-9]/g, "")
          if (!isCodeComplete(sanitizedCode)) {
            helpers.setFieldError("code", "Saisissez les 6 chiffres reçus.")
            helpers.setSubmitting(false)
            return
          }

          try {
            await verifyCode({ email: submittedEmail, code: sanitizedCode })
            toast.success("Connexion réussie !")
            navigate(paths.workspaces, { replace: true })
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Code invalide ou expiré.")
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ values, setFieldValue, isSubmitting, errors, touched }) => {
          const handleResendClick = async () => {
            const normalizedEmail = email.trim().toLowerCase()

            if (!normalizedEmail) {
              toast.error("Indiquez une adresse email pour renvoyer le code.")
              return
            }

            try {
              setIsResending(true)
              await requestCode(normalizedEmail)
              setFieldValue("code", "", false)
              toast.success("Nouveau code envoyé.")
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Impossible d'envoyer un nouveau code.")
            } finally {
              setIsResending(false)
            }
          }

          return (
            <Form className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Code de validation</Label>
                <CodeInput
                  value={values.code}
                  onChange={(next) => setFieldValue("code", next)}
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  {touched.code && errors.code ? (
                    <p className="text-xs font-medium text-destructive">{errors.code}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Le code expire dans les 10 prochaines minutes.</p>
                </div>
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-lg bg-[#026c7a] text-base font-semibold text-white shadow-sm transition hover:bg-[#015d6a]"
                disabled={isSubmitting || !isCodeComplete(values.code)}
              >
                {isSubmitting ? "Vérification..." : "Valider et me connecter"}
              </Button>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Vous n’avez pas reçu de code ?</span>
                  <button
                    type="button"
                    onClick={handleResendClick}
                    disabled={isResending}
                    className="font-medium text-[#f26a24] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResending ? "Renvoi..." : "Renvoyer le code"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(paths.login)}
                  className="self-start text-sm font-medium text-[#026c7a] underline-offset-4 hover:underline"
                >
                  Modifier l’adresse email
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </AuthPageLayout>
  )
}

import { Formik, Form } from "formik"
import { useNavigate } from "react-router-dom"

import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { paths } from "@/routes/paths"
import { toast } from "sonner"

import heroImage from "@/assets/images/login-illustration.png"

export function RequestCodePage() {
  const navigate = useNavigate()
  const { requestCode, pendingEmail } = useAuth()

  const initialValues = { email: pendingEmail ?? "" }

  const emailValidation = (value: string) => {
    if (!value) {
      return "Merci d'indiquer votre adresse email."
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    if (!emailRegex.test(value)) {
      return "Adresse email invalide."
    }
    return undefined
  }

  return (
    <AuthPageLayout
      title="Bienvenue sur VDM 👋"
      subtitle="Veuillez remplir vos coordonnées ci-dessous pour vous connecter."
      accent="teal"
      heroImage={{ src: heroImage, alt: "Login Illustration" }}
    >
      <Formik
        initialValues={initialValues}
        onSubmit={async (values, helpers) => {
          const email = values.email.trim().toLowerCase()
          const errorMessage = emailValidation(email)
          if (errorMessage) {
            helpers.setFieldError("email", errorMessage)
            helpers.setSubmitting(false)
            return
          }

          try {
            await requestCode(email)
            toast.success("Code envoyé ! Consultez votre messagerie ou la console backend.")
            navigate(paths.verify, {
              replace: true,
              state: {
                email,
              },
            })
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible d'envoyer le code.")
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <TextField
              name="email"
              type="email"
              label="Adresse email"
              autoComplete="email"
              validate={emailValidation}
            />
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-[#026c7a] text-base font-semibold text-white shadow-sm transition hover:bg-[#015d6a]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours..." : "Se connecter"}
            </Button>
          </Form>
        )}
      </Formik>
      <div className="relative my-6 flex items-center justify-center">
        <span className="absolute inset-x-0 h-px bg-border" aria-hidden />
        <span className="relative bg-white px-4 text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Ou
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Vous n’avez pas encore de compte ?
        <button
          type="button"
          onClick={() => navigate(paths.register)}
          className="ml-1 font-medium text-[#f26a24] underline-offset-4 hover:underline"
        >
          S’inscrire
        </button>
      </p>
    </AuthPageLayout>
  )
}

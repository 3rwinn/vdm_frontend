import { Formik, Form } from "formik"
import { useNavigate } from "react-router-dom"

import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { paths } from "@/routes/paths"
import { toast } from "sonner"

import heroImage from "@/assets/images/register-illustration.png"

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const initialValues = {
    last_name: "",
    first_name: "",
    email: "",
  }

  const validate = (values: typeof initialValues) => {
    const errors: Partial<typeof initialValues> = {}
    if (!values.last_name.trim()) {
      errors.last_name = "Nom requis."
    }
    if (!values.first_name.trim()) {
      errors.first_name = "Prénoms requis."
    }
    if (!values.email.trim()) {
      errors.email = "Adresse email requise."
    } else {
      const emailRegex = /.+@.+\..+/i
      if (!emailRegex.test(values.email)) {
        errors.email = "Adresse email invalide."
      }
    }
    return errors
  }

  return (
    <AuthPageLayout
      title="Bienvenue sur VDM 👋"
      subtitle="Veuillez remplir vos coordonnées ci-dessous pour créer un compte."
      accent="orange"
      heroImage={{ src: heroImage, alt: "Login Illustration" }}
    >
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (values, helpers) => {
          const payload = {
            first_name: values.first_name.trim(),
            last_name: values.last_name.trim(),
            email: values.email.trim().toLowerCase(),
          }

          try {
            await register(payload)
            toast.success("Compte créé ! Un code vient d'être envoyé sur votre boîte mail.")
            navigate(paths.verify, {
              replace: true,
              state: {
                email: payload.email,
              },
            })
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de créer votre compte.")
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <TextField
              name="last_name"
              label="Nom"
              autoComplete="family-name"
            />
            <TextField
              name="first_name"
              label="Prénoms"
              autoComplete="given-name"
            />
            <TextField
              name="email"
              label="Adresse email"
              type="email"
              autoComplete="email"
            />
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-[#026c7a] text-base font-semibold text-white shadow-sm transition hover:bg-[#015d6a]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création en cours..." : "Créer mon compte"}
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
        Vous avez déjà un compte ?
        <button
          type="button"
          onClick={() => navigate(paths.login)}
          className="ml-1 font-medium text-[#f26a24] underline-offset-4 hover:underline"
        >
          Se connecter
        </button>
      </p>
    </AuthPageLayout>
  )
}

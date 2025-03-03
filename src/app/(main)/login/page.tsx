"use client"

import React from "react"
import Link from "next/link"
import * as Yup from "yup"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { siteConfig } from "@/app/siteConfig"
import { Form, FormField, SubmitButton } from "@/components/forms"
// import { requestValidationCode, verifyValidationCode } from "@/api/auth"
import { useRouter } from "next/navigation"
// import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/lib/useToast"
// import { Toaster } from "@/components/Toaster"
import { signIn } from "next-auth/react"

const validationSchemaStepOne = Yup.object().shape({
  email: Yup.string()
    .email("Merci d'entrer une adresse email valide")
    .required("Ce champ est requis"),
})

const validationSchemaStepTwo = Yup.object().shape({
  code: Yup.string()
    .length(6, "Must be exactly 6 digits")
    .required("Ce champ est requis"),
})

export default function Login() {
  const [step, setStep] = React.useState(1)
  const [email, setEmail] = React.useState("")

  const [loading, setLoading] = React.useState(false)

  const router = useRouter()

  const { toast } = useToast()

  const handleSubmit = async (values) => {
    try {
      if (step === 1) {
        setLoading(true)
        const res = await fetch("/api/request-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        })
        setLoading(false)
        if (res.ok) {
          setEmail(values.email)
          setStep(2)
        } else {
          toast({
            title: "Erreur",
            variant: "error",
            description: "Une erreur s'est produite, merci de vérifier votre adresse email.",
            duration: 3000,
          })
        }
      } else {
        setLoading(true)
        const result = await signIn("credentials", {
          redirect: false,
          email,
          code: values.code,
        })
        setLoading(false)
        if (result?.ok) {
          router.push("/onboarding")
        } else {
          // Handle error
          console.log("result_data", result)
          toast({
            title: "Erreur",
            variant: "error",
            description: "Une erreur s'est produite.",
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.log("error", error)
      toast({
        title: "Erreur",
        variant: "error",
        description: "Erreur message à modifier",
        duration: 3000,
      })
    }
  }

  return (
    <>
      {/* <Toaster /> */}
      <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong text-center font-semibold">
        Connexion
      </h3>
      <Form
        initialValues={step === 1 ? { email: "" } : { code: "" }}
        validationSchema={
          step === 1 ? validationSchemaStepOne : validationSchemaStepTwo
        }
        onSubmit={handleSubmit}
      >
        <FormField
          name="email"
          type="email"
          placeholder="johndoe@gmail.com"
          label="Adresse email"
          disabled={step === 2}
        />
        {step === 2 && (
          <FormField
            name="code"
            label="Code de vérification"
            placeholder="Entrer le code a 6 chiffres"
            type="text"
          />
        )}

        <SubmitButton loading={loading} className="mt-4 w-full">
          Se connecter
        </SubmitButton>
      </Form>

      <Divider>ou</Divider>

      <Link href={siteConfig.baseLinks.register}>
        <Button variant="secondary" className="w-full">
          S'inscrire
        </Button>
      </Link>
      <p className="text-tremor-label text-tremor-content dark:text-dark-tremor-content mt-4">
        En vous identifiant, vous acceptez nos{" "}
        <a href="#" className="underline underline-offset-4">
          conditions générales
        </a>{" "}
        et{" "}
        <a href="#" className="underline underline-offset-4">
          police de confidentialité
        </a>
        .
      </p>
    </>
  )
}

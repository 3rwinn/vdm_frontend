"use client"

import React from "react"
import Link from "next/link"
import * as Yup from "yup"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { siteConfig } from "@/app/siteConfig"
import { Form, FormField, SubmitButton } from "@/components/forms"
import { redirect } from 'next/navigation'

// import {
//   registerUser,
//   requestValidationCode,
//   verifyValidationCode,
// } from "@/old/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/useToast"
import { Toaster } from "@/components/Toaster"
// import { useAuth } from "@/hooks/useAuth"

const registerSchema = Yup.object().shape({
  first_name: Yup.string().required("Ce champ est requis"),
  last_name: Yup.string().required("Ce champ est requis"),
  email: Yup.string()
    .email("Merci d'entrer une adresse email valide")
    .required("Ce champ est requis"),
})

export default function Register() {
  const [loading, setLoading] = React.useState(false)

  const router = useRouter()

  const { toast } = useToast()

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.first_name,
          lastName: values.last_name,
          email: values.email,
        }),
      })
      setLoading(false)

      if (res.ok) {
        toast({
          title: "Inscription réussie",
          variant: "success",
          description: "Vous pouvez maintenant vous connecter.",
          duration: 3000,
        })
        router.push("/login")
      } else {
        const data = await res.json()
        console.log(data.error || "Registration failed")
      }
    } catch (error) {
      console.log("error", error)
    }
  }

  return (
    <>
    {/* <Toaster /> */}
      <h3 className="text-tremor-title text-tremor-content-strong dark:text-dark-tremor-content-strong text-center font-semibold">
        Inscription
      </h3>
      <Form
        initialValues={{ firstName: "", lastName: "", email: "" }}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        <>
          <FormField name="last_name" label="Nom" placeholder="" type="text" />
          <FormField
            name="first_name"
            label="Prenoms"
            placeholder=""
            type="text"
          />
          <FormField
            name="email"
            label="Adresse email"
            placeholder=""
            type="email"
          />
        </>

        <SubmitButton loading={loading} className="mt-4 w-full">
          S'inscrire
        </SubmitButton>
      </Form>
      <Divider>ou</Divider>

      <Link href={siteConfig.baseLinks.login}>
        <Button variant="secondary" className="w-full">
          Se connecter
        </Button>
      </Link>
      <p className="text-tremor-label text-tremor-content dark:text-dark-tremor-content mt-4">
        {/* By signing in, you agree to our{" "} */}
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

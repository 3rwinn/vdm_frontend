"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/button"
import {
  Form,
  SubmitButton,
  FormField,
  SpecialRadioField,
  SelectField,
  MutableSelectField,
} from "@/components/forms"
import { Card } from "@/components/Card"
import Paystack from "@paystack/inline-js"
import { useSession } from "next-auth/react"
import { useToast } from "@/lib/useToast"
// import { redirect, useRouter } from "next/navigation"
import { useProducts } from "@/hooks/useProducts"
import { useWorkspace } from "@/hooks/useWorkspace"
// import { RiLoader2Fill } from "@remixicon/react"
import {
  RadioCardGroup,
  RadioCardGroupIndicator,
  RadioCardItem,
} from "@/components/RadioCard"
import { useRouter } from "next/navigation"
import { useWorkspaceContext } from "@/context/WsContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { Badge } from "@/components/Badge"

function formatList(list: any) {
  return list?.map((item: any) => ({
    value: item,
    label: item,
  }))
}

const calculateFinalPrice = (basePrice: number, subscriptionMonths: string) => {
  return basePrice * parseInt(subscriptionMonths)
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

// New component for workspace cards
function WorkspaceCard({ workspace, onClick }) {
  return (
    <div
      onClick={onClick}
      className="w-full cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-indigo-500 dark:border-gray-700"
    >
      <h3 className="font-medium text-gray-900 dark:text-gray-50">
        {workspace.name}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {workspace.sector_activity} • {workspace.id_client}
      </p>
    </div>
  )
}

// Extract current form into a separate component
function WorkspaceCreationForm() {
  const { data: session, status } = useSession()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [activeProfile, setActiveProfile] = useState<string>("")
  const [activeSector, setActiveSector] = useState<string>("")
  const [mutableSelect, setMutableSelect] = useState<string>("none")
  const [mutableList, setMutableList] = useState<any[]>([])
  const [totalPrice, setTotalPrice] = useState(0)

  const { toast } = useToast()

  const router = useRouter()

  const { products } = useProducts()

  const { createWorkspace } = useWorkspace()

  console.log("selectedProductCode", selectedProduct)

  const {
    workspace,
    isLoading: isWorkspaceLoading,
    setWorkspace,
    sectorList,
    marqueList,
    fetchSectorList,
    fetchMarqueList,
    chainesBySector,
    marquesBySector,
    fetchChainesBySector,
    fetchMarqueBySector,
  } = useWorkspaceContext()

  useEffect(() => {
    fetchSectorList()
  }, [])

  useEffect(() => {
    if (activeProfile === "chaine" && activeSector !== "") {
      setMutableSelect("Chaine")
      fetchChainesBySector(activeSector)
    } else if (
      (activeProfile === "annonceur" || activeProfile === "investisseur") &&
      activeSector !== ""
    ) {
      setMutableSelect("Marque/Produit")
      fetchMarqueBySector(activeSector)
    }
  }, [activeProfile, activeSector])

  const [subscriptionType, setSubscriptionType] = useState("1")

  const typeClientOptions = [
    { value: "annonceur", label: "Annonceur", code: "MEP" },
    { value: "investisseur", label: "Investisseur direct", code: "MEP" },
    { value: "chaine", label: "Chaine TV ou Radio", code: "METV, MEM, MER" },
  ]

  const typeClientDatas = typeClientOptions.filter((option) =>
    option.code.includes(selectedProduct),
  )

  function initializeSteps(products: any) {
    // First we format our products datas

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      items: product.features.split(";"),
      price: product.price,
      code: product.code,
    }))

    // then we initialize our steps datas
    let stepsDatas = [
      {
        title: "Choisisser votre produit",
        component: (
          <div className="space-y-4">
            {/* <h3 className="font-semibold text-gray-900 dark:text-gray-50">
              Quel sont les produits qui vous interessent ?
            </h3> */}
            {/* <SpecialCheckboxField name="products" datas={formattedProducts} /> */}
            <SpecialRadioField
              name="product"
              datas={formattedProducts}
              sideEvent={setSelectedProduct}
            />
          </div>
        ),
      },
      {
        title: "Configurer votre espace de travail",
        component: (
          <div className="space-y-4">
            <SelectField
              label="Vous êtes un"
              name="type_client"
              placeholder="Cliquer pour séléctionner"
              options={typeClientDatas}
              sideEvent={setActiveProfile}
            />

            <div className="grid grid-cols-2 gap-4">
              <SelectField
                name="sector_activity"
                label="Secteur d'activité"
                placeholder="Cliquer pour choisir"
                options={formatList(sectorList)}
                sideEvent={setActiveSector}
              />

              <MutableSelectField
                name="id_client"
                label={mutableSelect}
                placeholder="Cliquer pour choisir"
                // options={formatList(mutableList)}
                options={
                  mutableSelect === "Chaine"
                    ? formatList(chainesBySector)
                    : formatList(marquesBySector)
                }
              />
            </div>

            <FormField
              name="workspaceName"
              label="Nom"
              type="text"
              placeholder="Monitoring de ...."
              caption="Vous pouvez changer ce nom plus tard."
            />
          </div>
        ),
      },
      {
        title: "Montant a payer",
        isLast: true,
        component: null,
      },
    ]

    return stepsDatas
  }

  const steps = initializeSteps(products)

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (values: any) => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 0 && !values.product) {
        setError("Veuillez séléctionner un produit")
        return
      }

      if (
        currentStep === 1 &&
        (values.type_client === "" ||
          values.sector_activity === "" ||
          values.id_client === "" ||
          values.workspaceName === "")
      ) {
        setError("Veuillez correctement remplir tous les champs")
        return
      }

      setError(null)
      setCurrentStep(currentStep + 1)

      const selectedProduct = products.find(
        (product) => parseInt(product.id) === parseInt(values.product),
      )

      setTotalPrice(selectedProduct?.price || 0)
    } else {
      // Handle final submission here
      const popup = new Paystack()
      popup.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,

        email: session?.user_data?.email,

        amount: calculateFinalPrice(parseInt(totalPrice), subscriptionType),

        onSuccess: async (transaction) => {
          console.log("onSuccess: ", transaction)

          const newWorkspace = await createWorkspace({
            name: values.workspaceName,
            owner: session?.user_data?.id,
            products: [values.product],
            type_client: values.type_client,
            sector_activity: values.sector_activity,
            id_client: values.id_client,
            months: parseInt(subscriptionType),
          })

          if (newWorkspace) {
            setWorkspace(newWorkspace)

            toast({
              title:
                "Paiement accepté, votre espace de travail est en cours de création",
            })

            router.push("/dashboard")
          } else {
            toast({
              title: "Erreur lors de la création de l'espace de travail",
              variant: "destructive",
            })
          }
        },

        onLoad: (response) => {
          console.log("onLoad: ", response)
        },

        onCancel: () => {
          console.log("onCancel")
          toast({
            title: "Paiement annulé",
            description: "Vous avez annulé le paiement",
            // variant: "destructive",
          })
        },

        onError: (error) => {
          console.log("Error: ", error.message)
          toast({
            title: "Erreur",
            // variant: "destructive",
            description: "Une erreur est survenue lors du paiement",
          })
        },
      })
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
  }, [status, router])

  return (
    <div className="p-0">
      <h3 className="text-center font-semibold text-gray-900 dark:text-gray-50">
        {steps[currentStep].title}
      </h3>

      <h6 className="mt-1 text-center text-sm leading-6 text-gray-500">
        Étape {currentStep + 1} sur {steps.length}
      </h6>
      {error && (
        <div className="mt-2 flex items-center justify-between gap-8 rounded-md bg-red-50 py-2.5 pl-2.5 pr-4 text-sm dark:bg-red-900/50">
          <div className="flex items-center gap-2 truncate">
            <Badge className="ring-none dark:ring-none rounded-full bg-red-800 text-white dark:bg-red-500 dark:text-white">
              Erreur
            </Badge>
            <span className="truncate text-red-800 dark:text-red-400">
              {error}
            </span>
          </div>
          {/* <button className="font-semibold text-red-800 dark:text-red-400">
            Download
          </button> */}
        </div>
      )}
      <Form
        initialValues={{
          workspaceName: "",
          type_client: "",
          sector_activity: "",
          id_client: "",
          product: "",
          subscriptionType: "1",
        }}
        onSubmit={handleSubmit}
      >
        <div className="mt-4" />

        {!steps[currentStep].isLast && steps[currentStep].component}
        {steps[currentStep].isLast && (
          <Card>
            <div className="space-y-6">
              <div>
                <h5 className="font-semibold">Type d&apos;abonnement</h5>
                <RadioCardGroup
                  defaultValue="1"
                  className="mt-3 grid grid-cols-2 gap-4"
                  name="subscriptionType"
                  onValueChange={(value) => setSubscriptionType(value)}
                >
                  <RadioCardItem value="1">
                    <div className="flex items-start space-x-4">
                      <RadioCardGroupIndicator />
                      <div>
                        <h3 className="font-medium">Mensuel</h3>
                        <p className="text-sm text-gray-500">
                          Facturation mensuelle
                        </p>
                      </div>
                    </div>
                  </RadioCardItem>

                  <RadioCardItem value="3">
                    <div className="flex items-start space-x-4">
                      <RadioCardGroupIndicator />
                      <div>
                        <h3 className="font-medium">Trimestriel</h3>
                        <p className="text-sm text-gray-500">
                          Facturation trimestrielle
                        </p>
                      </div>
                    </div>
                  </RadioCardItem>

                  <RadioCardItem value="12">
                    <div className="flex items-start space-x-4">
                      <RadioCardGroupIndicator />
                      <div>
                        <h3 className="font-medium">Annuel</h3>
                        <p className="text-sm text-gray-500">
                          Facturation annuelle
                        </p>
                      </div>
                    </div>
                  </RadioCardItem>
                </RadioCardGroup>
              </div>

              <div>
                <h5 className="font-semibold">Total</h5>
                <p className="text-lg text-gray-500">
                  {calculateFinalPrice(
                    totalPrice,
                    subscriptionType,
                  ).toLocaleString()}{" "}
                  FCFA
                  {(subscriptionType === "12" || subscriptionType === "3") && (
                    <span className="ml-2 text-sm text-gray-400">
                      ({totalPrice.toLocaleString()} FCFA/mois)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 flex items-center justify-between">
          {currentStep > 0 && (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              // variant="outline"
            >
              Précédent
            </Button>
          )}
          <div className="flex-grow" />
          <SubmitButton>
            {currentStep === steps.length - 1 ? "Soumettre" : "Suivant"}
          </SubmitButton>
        </div>
      </Form>
    </div>
  )
}

export function WorkspaceLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  )
}

function Onboarding() {
  const { status } = useSession()

  const router = useRouter()

  const {
    workspaces,
    isLoading: isWorkspaceLoading,
    setWorkspace,
  } = useWorkspaceContext()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (isWorkspaceLoading) {
    return <WorkspaceLoadingSkeleton /> // Create this component for loading state
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="workspaces" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workspaces">Mes espaces de travail</TabsTrigger>
          <TabsTrigger value="create">Créer un espace</TabsTrigger>
        </TabsList>

        <TabsContent
          value={workspaces?.length === 0 ? "create" : "workspaces"}
          className="space-y-4"
        >
          {workspaces?.length === 0 ? (
            <div className="text-center text-gray-500">
              Aucun espace de travail trouvé
            </div>
          ) : (
            // <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {workspaces?.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  onClick={() => {
                    setWorkspace(ws)
                    router.push("/dashboard")
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <div className="mx-auto max-w-2xl">
            <WorkspaceCreationForm />{" "}
            {/* Extract current form logic into this component */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Onboarding

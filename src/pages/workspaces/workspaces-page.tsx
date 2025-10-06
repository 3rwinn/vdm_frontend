import { useEffect, useMemo, useState } from "react";
import { Form, Formik } from "formik";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { TextField } from "@/components/forms/text-field";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  createWorkspace,
  fetchProducts,
  fetchWorkspaces,
  type ProductResponse,
  type WorkspaceResponse,
} from "@/lib/api";
import { persistSelectedWorkspace } from "@/lib/workspaces";
import { buildPath } from "@/routes/paths";
import { toast } from "sonner";

import Logo from "@/assets/images/logo-vdm.png";
import MonthlyIcon from "@/assets/images/pricing-monthly.png";
import QuarterlyIcon from "@/assets/images/pricing-semester.png";
import AnnualIcon from "@/assets/images/pricing-annual.png";

const heroContent = {
  title: "L’impact en données des médias révélés par les stats",
  description:
    "Un projet pour révéler l’impact réel de nos radios et télévisions à travers des données claires et accessibles.",
  testimonial: null,
  // testimonial: {
  //   quote:
  //     "En tant qu’analyste, disposer de données médias fiables change tout. VDM me permet de prendre des décisions rapides et éclairées.",
  //   name: "Daphne Park",
  //   role: "UI/UX Designer",
  // },
};

const accentPalette = [
  "from-[#0d8aa9] to-[#0a6279]",
  "from-[#f26a24] to-[#d54a04]",
  "from-[#7c3aed] to-[#5b21b6]",
  "from-[#0d8aa9] to-[#0a6279]",
];

const organisationOptions = [
  { value: "tv", label: "Chaîne TV" },
  { value: "radio", label: "Radio" },
  { value: "digital", label: "Plateforme digitale" },
];

const sectorOptions = [
  { value: "agroindustrie", label: "Agroindustrie" },
  { value: "telecom", label: "Télécom" },
  { value: "banque", label: "Banque & Assurance" },
  { value: "mode", label: "Mode & Beauté" },
];

const channelOptions = [
  { value: "rti1", label: "RTI 1" },
  { value: "radio_ci", label: "Radio CI" },
  { value: "canal+", label: "Canal+" },
  { value: "trace", label: "Trace FM" },
];

const pricingOptions = [
  {
    id: "monthly",
    title: "Mensuel",
    description:
      "Lorem ipsum dolor sit amet dolo roli sitiol conse ctetur adipiscing elit.",
    multiplier: 1,
    placeholderPrice: 10000,
    frequency: "Facturation mensuelle",
  },
  {
    id: "quarterly",
    title: "Trimestriel",
    description:
      "Lorem ipsum dolor sit amet dolo roli sitiol conse ctetur adipiscing elit.",
    multiplier: 3,
    placeholderPrice: 30000,
    frequency: "Facturation trimestrielle",
  },
  {
    id: "yearly",
    title: "Annuel",
    description:
      "Lorem ipsum dolor sit amet dolo roli sitiol conse ctetur adipiscing elit.",
    multiplier: 12,
    placeholderPrice: 120000,
    frequency: "Facturation annuelle",
  },
];

const creationSteps = [
  { id: 1, title: "Choisir votre produit", subtitle: "Sélection" },
  {
    id: 2,
    title: "Configurer votre espace",
    subtitle: "Informations générales",
  },
  { id: 3, title: "Type d’abonnement", subtitle: "Paiement" },
];

function formatPrice(input: string | number) {
  const value = typeof input === "number" ? input : Number(input);
  if (Number.isFinite(value)) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return String(input);
}

type WorkspaceFormValues = {
  product: string;
  organisationType: string;
  sector: string;
  channel: string;
  name: string;
  plan: string;
};

const initialFormValues: WorkspaceFormValues = {
  product: "",
  organisationType: "",
  sector: "",
  channel: "",
  name: "",
  plan: "",
};

function validateStep(values: WorkspaceFormValues, stepIndex: number) {
  const errors: Partial<Record<keyof WorkspaceFormValues, string>> = {};
  if (stepIndex === 0) {
    if (!values.product) {
      errors.product = "Sélectionnez un produit.";
    }
  }
  if (stepIndex === 1) {
    if (!values.organisationType.trim()) {
      errors.organisationType = "Choisissez un type d’organisation.";
    }
    if (!values.sector.trim()) {
      errors.sector = "Sélectionnez un secteur d’activité.";
    }
    if (!values.channel.trim()) {
      errors.channel = "Indiquez une chaîne.";
    }
    if (!values.name.trim()) {
      errors.name = "Donnez un nom à votre espace.";
    }
  }
  if (stepIndex === 2) {
    if (!values.plan.trim()) {
      errors.plan = "Choisissez un type d’abonnement.";
    }
  }
  return errors;
}

export function WorkspacesPage() {
  const { user, logout, tokens } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [stepIndex, setStepIndex] = useState(0);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState<boolean>(true);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);

  const accessToken = useMemo(() => tokens?.access ?? "", [tokens?.access]);

  useEffect(() => {
    let mounted = true;
    setProductsLoading(true);
    setProductsError(null);
    fetchProducts()
      .then((data) => {
        if (!mounted) return;
        setProducts(data);
      })
      .catch((error) => {
        if (!mounted) return;
        setProductsError(error.message);
      })
      .finally(() => {
        if (!mounted) return;
        setProductsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!accessToken) {
      setWorkspaces([]);
      setWorkspacesLoading(false);
      return () => {
        mounted = false;
      };
    }

    setWorkspacesLoading(true);
    setWorkspacesError(null);
    fetchWorkspaces(accessToken)
      .then((data) => {
        if (!mounted) return;
        setWorkspaces(data);
      })
      .catch((error) => {
        if (!mounted) return;
        setWorkspacesError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!mounted) return;
        setWorkspacesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const availableProducts = products.length > 0 ? products : [];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-full max-w-md flex-col justify-between bg-[#0b7484] p-12 text-white md:flex">
        {/* <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-xl font-semibold">
            VDM
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold">VDM</span>
            <span className="text-xs uppercase tracking-[0.2em] text-white/70">Valorisation des médias</span>
          </div>
        </div> */}
        <div>
          <img src={Logo} className="h-[173px] w-[246px]" />
        </div>
        <div className="mt-10 space-y-6">
          <h1 className="text-3xl font-semibold leading-tight">
            {heroContent.title}
          </h1>
          <p className="text-sm text-white/80">{heroContent.description}</p>
        </div>
        <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
          <p className="text-sm leading-relaxed text-white/80">
            “{heroContent.testimonial.quote}”
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/30" />
            <div>
              <p className="text-sm font-semibold text-white">
                {heroContent.testimonial.name}
              </p>
              <p className="text-xs text-white/70">
                {heroContent.testimonial.role}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-1">
            <span className="h-1.5 w-4 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Mon espace de travail
            </h2>
            <p className="text-sm text-muted-foreground">
              Bonjour {user?.first_name ?? ""}, gérez vos espaces depuis cette
              page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border border-border/60 text-sm"
              onClick={() => logout()}
            >
              Se déconnecter
            </Button>
          </div>
        </header>

        <div className="mt-10 flex flex-wrap items-center gap-6 pb-4 text-sm font-medium text-muted-foreground">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`relative pb-2 transition ${
              activeTab === "list" ? "text-foreground" : "hover:text-foreground"
            }`}
          >
            Mes espaces de travail
            {activeTab === "list" ? (
              <span className="absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full bg-[#f26a24]" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`relative pb-2 transition ${
              activeTab === "create"
                ? "text-foreground"
                : "hover:text-foreground"
            }`}
          >
            Créer un espace
            {activeTab === "create" ? (
              <span className="absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full bg-[#f26a24]" />
            ) : null}
          </button>
        </div>

        {activeTab === "list" ? (
          <section className="mt-10">
            {workspacesLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3).keys()].map((index) => (
                  <div
                    key={`workspace-skeleton-${index}`}
                    className="h-56 animate-pulse rounded-3xl border border-border/70 bg-muted/40"
                  />
                ))}
              </div>
            ) : workspacesError ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {workspacesError}
              </div>
            ) : workspaces.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucun workspace pour l’instant. Créez votre premier espace !
                </p>
                <Button
                  onClick={() => setActiveTab("create")}
                  className="rounded-lg bg-[#026c7a] hover:bg-[#015d6a]"
                >
                  Créer un espace
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces.map((workspace, index) => {
                  const accent = accentPalette[index % accentPalette.length];
                  const productNames =
                    workspace.products_details?.map((product) => product.name).join(", ") ?? "Produit personnalisé";
                  const organisationLabel =
                    organisationOptions.find((option) => option.value === workspace.type_client)?.label ??
                    workspace.type_client ??
                    "Organisation";
                  const channelLabel =
                    channelOptions.find((option) => option.value === workspace.id_client)?.label ??
                    workspace.id_client ??
                    "";
                  const planMeta = pricingOptions.find((option) => option.id === workspace.paystack_subscription_plan);
                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        persistSelectedWorkspace(workspace)
                        navigate(buildPath.dashboard(workspace.id), {
                          state: { workspace },
                        });
                      }}
                      className="relative overflow-hidden rounded-3xl border border-border/70 bg-white text-left shadow-sm transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#026c7a]/40"
                    >
                      <div className={`h-48 w-full bg-gradient-to-br ${accent}`} />
                      <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-[#026c7a]">
                        {index + 1}
                      </span>
                      <div className="space-y-3 px-5 py-4">
                        <div className="space-y-1.5">
                          <p className="text-base font-semibold text-foreground">{workspace.name}</p>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {organisationLabel}
                            {channelLabel ? ` • ${channelLabel}` : ""}
                          </p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">Produit(s) sélectionné(s)</p>
                          <p>{productNames}</p>
                          {planMeta ? (
                            <p className="text-[#f26a24]">{planMeta.frequency}</p>
                          ) : null}
                        </div>
                        {workspace.is_active ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            Abonnement actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                            En attente d’activation
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-10 space-y-8">
            <Stepper activeIndex={stepIndex} />

            <Formik
              enableReinitialize
              initialValues={initialFormValues}
              validate={(values) => validateStep(values, stepIndex)}
              onSubmit={async (values, helpers) => {
                const errors = validateStep(values, stepIndex);
                if (Object.keys(errors).length > 0) {
                  helpers.setErrors(errors);
                  const touched = Object.keys(errors).reduce((acc, key) => {
                    acc[key as keyof WorkspaceFormValues] = true;
                    return acc;
                  }, {} as Record<keyof WorkspaceFormValues, boolean>);
                  helpers.setTouched(touched, false);
                  helpers.setSubmitting(false);
                  return;
                }

                if (stepIndex < creationSteps.length - 1) {
                  setStepIndex((prev) => prev + 1);
                  helpers.setTouched({}, false);
                  helpers.setSubmitting(false);
                  return;
                }

                if (!accessToken) {
                  toast.error("Impossible de créer l’espace : session expirée.");
                  helpers.setSubmitting(false);
                  return;
                }

                const payload = {
                  name: values.name.trim(),
                  type_client: values.organisationType.trim(),
                  sector_activity: values.sector.trim(),
                  id_client: values.channel.trim(),
                  paystack_subscription_plan: values.plan.trim(),
                  products: [values.product],
                };

                try {
                  const workspace = await createWorkspace(payload, accessToken);
                  toast.success("Workspace créé et abonnement confirmé !");
                  setWorkspaces((prev) => [workspace, ...prev]);
                  helpers.resetForm();
                  setStepIndex(0);
                  persistSelectedWorkspace(workspace)
                  navigate(buildPath.dashboard(workspace.id), {
                    replace: true,
                    state: { workspace },
                  });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Impossible de créer l’espace.");
                } finally {
                  helpers.setSubmitting(false);
                }
              }}
            >
              {({
                isSubmitting,
                setFieldValue,
                setFieldTouched,
                values,
                errors,
                touched,
              }) => (
                <Form className="space-y-6">
                  {stepIndex === 0 ? (
                    <div className="space-y-4">
                      {productsLoading ? (
                        <div className="flex flex-col gap-3">
                          {[...Array(3).keys()].map((index) => (
                            <div
                              key={index}
                              className="h-24 rounded-2xl border border-border/60 bg-muted/40"
                            />
                          ))}
                        </div>
                      ) : productsError ? (
                        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                          {productsError}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {availableProducts.length === 0 ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                              Aucun produit disponible pour le moment.
                            </div>
                          ) : null}
                          {availableProducts.map((product, index) => {
                            const isSelected =
                              values.product === String(product.id);
                            const accent =
                              accentPalette[index % accentPalette.length];
                            const featureList = product.features
                              .split(/\r?\n|[•;,-]/)
                              .map((item) => item.trim())
                              .filter(Boolean);

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() =>
                                  setFieldValue("product", String(product.id))
                                }
                                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#60b5c2]/60 ${
                                  isSelected
                                    ? "border-[#026c7a] bg-[#026c7a]/10"
                                    : "border-border/70 hover:border-[#026c7a]/60"
                                }`}
                              >
                                <div className="flex flex-col gap-4 sm:flex-row">
                                  <div
                                    className={`hidden h-8 w-8 shrink-0 rounded-md bg-gradient-to-br ${accent} sm:block`}
                                  />
                                  <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <h3 className="text-base font-semibold text-foreground">
                                        {product.name}
                                      </h3>
                                      <span
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                          isSelected
                                            ? "bg-[#026c7a] text-white"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {isSelected ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          index + 1
                                        )}
                                      </span>
                                    </div>
                                    {featureList.length > 0 ? (
                                      <ul className="space-y-1 text-xs text-muted-foreground">
                                        {featureList.map(
                                          (feature, featureIndex) => (
                                            <li
                                              key={`${product.id}-feature-${featureIndex}`}
                                              className="flex items-start gap-2"
                                            >
                                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#026c7a]" />
                                              <span>{feature}</span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    ) : null}
                                    <p className="text-xs font-medium text-[#026c7a]">
                                      {formatPrice(product.price)} / mois
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {!productsLoading && errors.product ? (
                        <p className="text-xs font-medium text-destructive">
                          {errors.product}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {stepIndex === 1 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SelectField
                          name="organisationType"
                          label="Vous êtes un"
                          placeholder="Sélectionnez un type"
                          options={organisationOptions}
                        />
                        <SelectField
                          name="sector"
                          label="Secteur d’activité"
                          placeholder="Sélectionnez un secteur"
                          options={sectorOptions}
                        />
                      </div>
                      <SelectField
                        name="channel"
                        label="Chaîne"
                        placeholder="Choisissez une chaîne"
                        options={channelOptions}
                      />
                      <TextField
                        name="name"
                        label="Nom de l’espace"
                        placeholder="Campagne Q1 2025"
                        validate={(value) =>
                          validateStep({ ...values, name: value ?? "" }, 1).name
                        }
                        hint="Vous pourrez le modifier plus tard."
                      />
                    </div>
                  ) : null}

                  {stepIndex === 2 ? (
                    <div className="space-y-4">
                      <div className="grid gap-6 md:grid-cols-3">
                        {pricingOptions.map((option) => {
                          const selectedProduct = availableProducts.find(
                            (product) => String(product.id) === values.product
                          );
                          const basePrice = selectedProduct
                            ? Number(selectedProduct.price)
                            : null;
                          const computedPrice =
                            basePrice !== null && !Number.isNaN(basePrice)
                              ? basePrice * option.multiplier
                              : option.placeholderPrice;

                          const optionIcon =
                            option.id === "monthly"
                              ? MonthlyIcon
                              : option.id === "quarterly"
                              ? QuarterlyIcon
                              : AnnualIcon;
                          const isSelected = values.plan === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                setFieldValue("plan", option.id);
                                setFieldTouched("plan", true, false);
                              }}
                              className={`flex h-full flex-col justify-between rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#f26a24]/40 ${
                                isSelected
                                  ? "border-[#f26a24] bg-[#f26a24]/5"
                                  : "border-border/60 bg-white"
                              }`}
                            >
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                    <img
                                      src={optionIcon}
                                      alt={`Illustration ${option.title}`}
                                      className="h-6 w-6"
                                    />
                                  </div>
                                  {isSelected && (
                                    <span
                                      className={`rounded-full border px-2 py-1 text-xs font-medium 
                                          "border-[#f26a24] bg-[#f26a24]/10 text-[#f26a24]"
                                      `}
                                    >
                                      Sélectionné
                                    </span>
                                  )}
                                  
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-lg font-semibold text-[#083349]">
                                    {option.title}
                                  </h3>
                                  <p className="text-xs leading-relaxed text-[#4f6977]">
                                    {option.description}
                                  </p>
                                  <p className="text-xl font-semibold text-[#083349]">
                                    {formatPrice(computedPrice)}
                                  </p>
                                  <p className="text-xs font-medium text-[#f26a24]">
                                    {option.frequency}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.plan && touched.plan ? (
                        <p className="text-xs font-medium text-destructive">
                          {errors.plan}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full rounded-lg border border-border/70 text-sm text-muted-foreground hover:bg-muted/40 sm:w-auto"
                      onClick={() =>
                        setStepIndex((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={stepIndex === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                    </Button>
                    <Button
                      type="submit"
                      className="w-full rounded-lg bg-[#f26a24] text-base font-semibold text-white hover:bg-[#de581f] sm:w-auto"
                      disabled={
                        isSubmitting ||
                        (stepIndex === creationSteps.length - 1 &&
                          !values.plan.trim())
                      }
                    >
                      {stepIndex === creationSteps.length - 1
                        ? "Finaliser"
                        : "Continuer"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </section>
        )}
      </main>
    </div>
  );
}

interface StepperProps {
  activeIndex: number;
}

function Stepper({ activeIndex }: StepperProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      {creationSteps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                isCompleted
                  ? "border-[#026c7a] bg-[#026c7a] text-white"
                  : isActive
                  ? "border-[#f26a24] text-[#f26a24]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {step.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {step.subtitle}
              </span>
            </div>
            {index < creationSteps.length - 1 ? (
              <span className="hidden h-px w-10 bg-border sm:block" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

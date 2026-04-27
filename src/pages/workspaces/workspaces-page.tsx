import { useCallback, useEffect, useMemo, useState } from "react";
import { Form, Formik } from "formik";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { TextField } from "@/components/forms/text-field";
import { SelectField } from "@/components/forms/select-field";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePaystack } from "@/hooks/use-paystack";
import {
  createWorkspace,
  fetchProducts,
  fetchWorkspaces,
  fetchSectors,
  fetchChainsBySector,
  fetchBrandsBySector,
  type ProductResponse,
  type WorkspaceResponse,
} from "@/lib/api";
import { persistSelectedWorkspace } from "@/lib/workspaces";
import { buildPath } from "@/routes/paths";
import { toast } from "sonner";

import Logo from "@/assets/images/logo-vdm-white.png";
import MonthlyIcon from "@/assets/images/pricing-monthly.png";
import QuarterlyIcon from "@/assets/images/pricing-semester.png";
import AnnualIcon from "@/assets/images/pricing-annual.png";
import VdmMetvImage from "@/assets/images/vdm-metv-ico.png";
import VdmMepImage from "@/assets/images/vdm-mep-ico.png";
import VdmMemImage from "@/assets/images/vdm-mem-ico.png";
import VdmMerImage from "@/assets/images/vdm-mer-ico.png";

const productBackgrounds: Record<string, string> = {
  metv: VdmMetvImage,
  mep: VdmMepImage,
  mem: VdmMemImage,
  mer: VdmMerImage,
};

const heroContent = {
  title: "L’impact en données des médias révélés par les stats",
  description:
    "Un projet pour révéler l’impact réel de nos radios et télévisions à travers des données claires et accessibles.",
  // testimonial: {
  //   quote: "",
  // },
  testimonial: {
    quote:
      "En tant qu’analyste, disposer de données médias fiables change tout. VDM me permet de prendre des décisions rapides et éclairées.",
    name: "Daphne Park",
    role: "UI/UX Designer",
  },
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
  { value: "annonceur", label: "Annonceur" },
  { value: "investor", label: "Investisseur direct" },
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
  paystackReference: string;
};

const initialFormValues: WorkspaceFormValues = {
  product: "",
  organisationType: "",
  sector: "",
  channel: "",
  name: "",
  plan: "",
  paystackReference: "",
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
    if (!values.paystackReference.trim()) {
      errors.paystackReference = "Le paiement doit être confirmé par Paystack.";
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
  const [sectors, setSectors] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [sectorsLoading, setSectorsLoading] = useState(false);
  const [sectorsError, setSectorsError] = useState<string | null>(null);
  const [chains, setChains] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [chainsLoading, setChainsLoading] = useState(false);
  const [chainsError, setChainsError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(
    null
  );
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState<boolean>(true);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);

  const accessToken = useMemo(() => tokens?.access ?? "", [tokens?.access]);
  const availableProducts = products;
  const { startTransaction, isConfigured: isPaystackConfigured } =
    usePaystack();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

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
    if (!tokens?.access) {
      setSectors([]);
      return;
    }

    let active = true;
    setSectorsLoading(true);
    setSectorsError(null);
    fetchSectors(tokens.access)
      .then((response) => {
        if (!active) return;
        const options = (response.sectors ?? []).map((sector) => ({
          value: sector,
          label: sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase(),
        }));
        setSectors(options);
      })
      .catch((error) => {
        if (!active) return;
        setSectorsError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les secteurs"
        );
      })
      .finally(() => {
        if (!active) return;
        setSectorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tokens?.access]);

  const loadChainsForSector = useCallback(
    async (sector: string) => {
      if (!tokens?.access || !sector) {
        setChains([]);
        return;
      }

      setChainsLoading(true);
      setChainsError(null);
      try {
        const response = await fetchChainsBySector(sector, tokens.access);
        const options = (response.chaines ?? []).map((chain) => ({
          value: chain,
          label: chain,
        }));
        setChains(options);
      } catch (error) {
        setChainsError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les chaînes"
        );
        setChains([]);
      } finally {
        setChainsLoading(false);
      }
    },
    [tokens?.access]
  );

  const loadBrandsForSector = useCallback(
    async (sector: string) => {
      if (!tokens?.access || !sector) {
        setBrands([]);
        return;
      }

      setBrandsLoading(true);
      setBrandsError(null);
      try {
        const response = await fetchBrandsBySector(sector, tokens.access);
        const options = (response.marques ?? []).map((brand) => ({
          value: brand,
          label: brand,
        }));
        setBrands(options);
      } catch (error) {
        setBrandsError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les marques"
        );
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    },
    [tokens?.access]
  );

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
        setWorkspacesError(
          error instanceof Error ? error.message : String(error)
        );
      })
      .finally(() => {
        if (!mounted) return;
        setWorkspacesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const sectorSelectOptions = sectors;
  const chainSelectOptions = useMemo(() => {
    const currentProduct = (selectedProductCode ?? "").toLowerCase();

    if (!chains.length) {
      return chains;
    }

    if (currentProduct === "mer") {
      return chains.filter((option) => option.label.toLowerCase().includes("radio"));
    }

    if (currentProduct === "metv") {
      return chains.filter((option) => !option.label.toLowerCase().includes("radio"));
    }

    return chains;
  }, [chains, selectedProductCode]);
  const brandSelectOptions = brands;
  const requiresBrandSelect =
    (selectedProductCode ?? "").toLowerCase() === "mep";
  const channelSelectOptions = requiresBrandSelect
    ? brandSelectOptions
    : chainSelectOptions;
  const channelLoading = requiresBrandSelect ? brandsLoading : chainsLoading;
  const channelError = requiresBrandSelect ? brandsError : chainsError;
  const channelPlaceholder = requiresBrandSelect
    ? "Choisissez une marque"
    : "Choisissez une chaîne";
  const channelLabel = requiresBrandSelect ? "Produit / Marque" : "Chaîne";

  const organisationSelectOptions = useMemo(() => {
    const currentProduct = (selectedProductCode ?? "").toLowerCase();

    if (currentProduct === "mer") {
      return organisationOptions.filter((option) => option.value !== "tv");
    }

    if (currentProduct === "metv") {
      return organisationOptions.filter((option) => option.value !== "radio");
    }

    if (currentProduct === "mep") {
      return organisationOptions.filter(
        (option) => option.value !== "tv" && option.value !== "radio"
      );
    }

    return organisationOptions;
  }, [selectedProductCode]);

  useEffect(() => {
    if (!selectedSector) {
      setChains([]);
      setBrands([]);
      return;
    }

    if (requiresBrandSelect) {
      loadBrandsForSector(selectedSector);
      setChains([]);
    } else {
      loadChainsForSector(selectedSector);
      setBrands([]);
    }
  }, [
    selectedSector,
    requiresBrandSelect,
    loadBrandsForSector,
    loadChainsForSector,
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-full max-w-md flex-col justify-between bg-[#0b7484] p-12 text-white md:flex">
        <div>
          <img src={Logo} className="h-[173px] w-1auto" />
        </div>
        <div className="mt-0 space-y-4">
          <h1 className="text-2xl font-semibold leading-tight">
            {heroContent.title}
          </h1>
          <p className="text-sm text-white/80">{heroContent.description}</p>
        </div>

        <div className="p-6 bg-[#1FA9B8] rounded-md">
          <p className="italic">
            "As a freelancer, finding the right gigs can be challenging, but
            FreelanceHub made it simple. I love the personalized job
            recommendations and the ability to showcase my portfolio"
          </p>
          <div className="mt-2">
            <b>John Doe</b>
            <br />
            <span>Investisseur</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 max-h-screen overflow-y-auto px-6 py-10 md:px-12">
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
                    workspace.products_details
                      ?.map((product) => product.name)
                      .join(", ") ?? "Produit personnalisé";
                  const organisationLabel =
                    organisationOptions.find(
                      (option) => option.value === workspace.type_client
                    )?.label ??
                    workspace.type_client ??
                    "Organisation";
                  const channelLabel = workspace.id_client ?? "";
                  const planMeta = pricingOptions.find(
                    (option) =>
                      option.id === workspace.paystack_subscription_plan
                  );
                  const productCode = workspace.products_details?.[0]?.code
                    ? String(workspace.products_details[0].code).trim().toLowerCase()
                    : null;
                  const backgroundImage = productCode
                    ? productBackgrounds[productCode] ?? null
                    : null;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        persistSelectedWorkspace(workspace);
                        navigate(buildPath.dashboard(workspace.id), {
                          state: { workspace },
                        });
                      }}
                      className="bg-red-300 relative overflow-hidden rounded-3xl border border-border/70 bg-white text-left shadow-sm transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#026c7a]/40"
                    >
                      <div className="relative h-68 w-full">
                        {backgroundImage ? (
                          <img
                            src={backgroundImage}
                            alt="Illustration produit"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className={`h-full w-full bg-gradient-to-br ${accent}`} />
                        )}
                      </div>
                      <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-[#026c7a]">
                        {index + 1}
                      </span>
                      <div className="space-y-3 px-5 py-4">
                        <div className="space-y-1.5">
                          <p className="text-base font-semibold text-foreground">
                            {workspace.name}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {organisationLabel}
                            {channelLabel ? ` • ${channelLabel}` : ""}
                          </p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {/* <p className="font-medium text-foreground">
                            Produit(s) sélectionné(s)
                          </p> */}
                          <p className="font-medium text-foreground">{productNames}</p>
                          {planMeta ? (
                            <p className="text-[#f26a24]">
                              {planMeta.frequency}
                            </p>
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
                  toast.error(
                    "Impossible de créer l’espace : session expirée."
                  );
                  helpers.setSubmitting(false);
                  return;
                }

                const productId = Number(values.product);
                const productsPayload = values.product.trim()
                  ? [Number.isFinite(productId) ? productId : values.product]
                  : [];
                const payload = {
                  name: values.name.trim(),
                  type_client: values.organisationType.trim(),
                  sector_activity: values.sector.trim(),
                  id_client: values.channel.trim(),
                  plan: values.plan.trim(),
                  paystack_reference: values.paystackReference.trim(),
                  products: productsPayload,
                };

                try {
                  const workspace = await createWorkspace(payload, accessToken);
                  toast.success("Workspace créé et abonnement confirmé !");
                  setWorkspaces((prev) => [workspace, ...prev]);
                  helpers.resetForm();
                  setStepIndex(0);
                  setChains([]);
                  setBrands([]);
                  setSelectedProductCode(null);
                  setSelectedSector("");
                  setProcessingPlanId(null);
                  persistSelectedWorkspace(workspace);
                  navigate(buildPath.dashboard(workspace.id), {
                    replace: true,
                    state: { workspace },
                  });
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Impossible de créer l’espace."
                  );
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
                          {products.length === 0 ? (
                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                              Aucun produit disponible pour le moment.
                            </div>
                          ) : null}
                          {products.map((product, index) => {
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
                                onClick={() => {
                                  setSelectedProductCode(product.code ?? null);
                                  setChains([]);
                                  setBrands([]);
                                  setFieldValue("product", String(product.id));
                                  setFieldValue("channel", "", false);
                                }}
                                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#60b5c2]/60 ${
                                  isSelected
                                    ? "border-[#026c7a] bg-[#026c7a]/10"
                                    : "border-border/70 hover:border-[#026c7a]/60"
                                }`}
                              >
                                <div className="flex flex-col gap-4 sm:flex-row">
                                  <div
                        className="hidden h-8 w-8 shrink-0 rounded-md sm:block"
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
                            options={organisationSelectOptions}
                          />
                        <SelectField
                          name="sector"
                          label="Secteur d’activité"
                          placeholder="Sélectionnez un secteur"
                          options={sectorSelectOptions}
                          disabled={sectorsLoading}
                          onValueChange={(value) => {
                            setSelectedSector(value);
                            setFieldValue("channel", "", false);
                            if (!value) {
                              setChains([]);
                              setBrands([]);
                              return;
                            }

                            if (requiresBrandSelect) {
                              loadBrandsForSector(value);
                              setChains([]);
                            } else {
                              loadChainsForSector(value);
                              setBrands([]);
                            }
                          }}
                        />
                      </div>
                      {sectorsLoading ? (
                        <p className="text-xs text-muted-foreground">
                          Chargement des secteurs…
                        </p>
                      ) : sectorsError ? (
                        <p className="text-xs font-medium text-destructive">
                          {sectorsError}
                        </p>
                      ) : null}
                      <SelectField
                        name="channel"
                        label={channelLabel}
                        placeholder={channelPlaceholder}
                        options={channelSelectOptions}
                        disabled={channelLoading || !values.sector}
                      />
                      {channelLoading ? (
                        <p className="text-xs text-muted-foreground">
                          Chargement en cours…
                        </p>
                      ) : channelError ? (
                        <p className="text-xs font-medium text-destructive">
                          {channelError}
                        </p>
                      ) : null}
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
                          const isProcessing = processingPlanId === option.id;

                          const handlePlanSelection = () => {
                            if (!selectedProduct) {
                              toast.error("Sélectionnez d’abord un produit.");
                              return;
                            }

                            if (!isPaystackConfigured) {
                              toast.error("Configuration Paystack manquante.");
                              return;
                            }

                            if (!user?.email) {
                              toast.error(
                                "Impossible de récupérer votre email pour Paystack."
                              );
                              return;
                            }

                            const amount =
                              basePrice !== null && !Number.isNaN(basePrice)
                                ? basePrice * option.multiplier
                                : option.placeholderPrice;
                            const amountKobo = Math.round(Number(amount) * 100);

                            setProcessingPlanId(option.id);
                            setFieldValue("plan", "", false);
                            setFieldValue("paystackReference", "", false);

                            startTransaction({
                              email: user.email,
                              firstName: user.first_name,
                              lastName: user.last_name,
                              amountKobo,
                              currency: "XOF",
                              metadata: {
                                workspace_name: values.name || "",
                                product_id: String(selectedProduct.id),
                                product_name: selectedProduct.name,
                                plan: option.id,
                              },
                              onSuccess: ({ reference }) => {
                                toast.success("Paiement Paystack confirmé ✔️");
                                setProcessingPlanId(null);
                                setFieldValue("plan", option.id, false);
                                setFieldTouched("plan", true, false);
                                setFieldValue(
                                  "paystackReference",
                                  reference,
                                  false
                                );
                                setFieldTouched(
                                  "paystackReference",
                                  true,
                                  false
                                );
                              },
                              onCancel: () => {
                                toast.info("Paiement annulé.");
                                setProcessingPlanId(null);
                              },
                              onError: (error) => {
                                console.error("Paystack inline error", error);
                                toast.error(
                                  error.message ??
                                    "Paiement Paystack indisponible."
                                );
                                setProcessingPlanId(null);
                              },
                            });
                          };

                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={handlePlanSelection}
                              disabled={isProcessing || !values.product}
                              className={`flex h-full flex-col justify-between rounded-3xl border p-6 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#f26a24]/40 ${
                                isSelected
                                  ? "border-[#f26a24] bg-[#f26a24]/5"
                                  : "border-border/60 bg-white hover:-translate-y-1"
                              } ${
                                isProcessing || !values.product
                                  ? "cursor-not-allowed opacity-60"
                                  : ""
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
                                  {isProcessing ? (
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Paiement en cours…
                                    </span>
                                  ) : isSelected ? (
                                    <span className="rounded-full border border-[#f26a24] bg-[#f26a24]/10 px-2 py-1 text-xs font-medium text-[#f26a24]">
                                      Sélectionné
                                    </span>
                                  ) : null}
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
                      {!isPaystackConfigured ? (
                        <p className="text-xs font-medium text-destructive">
                          Clé publique Paystack manquante dans l’environnement.
                        </p>
                      ) : null}
                      {errors.plan && touched.plan ? (
                        <p className="text-xs font-medium text-destructive">
                          {errors.plan}
                        </p>
                      ) : null}
                      {errors.paystackReference &&
                      (touched.paystackReference || touched.plan) ? (
                        <p className="text-xs font-medium text-destructive">
                          {errors.paystackReference}
                        </p>
                      ) : null}
                      {values.paystackReference ? (
                        <p className="text-xs font-medium text-emerald-600">
                          Référence Paystack : {values.paystackReference}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Un paiement Paystack validé est requis pour activer
                          l’abonnement.
                        </p>
                      )}
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
                          (!values.plan.trim() ||
                            !values.paystackReference.trim()))
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

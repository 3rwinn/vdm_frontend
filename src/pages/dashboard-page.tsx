import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchBrandsBySector,
  fetchChainsBySector,
  fetchDeepDiveAnalysis,
  fetchMemAnalysis,
  fetchMepAnalysis,
  fetchSectors,
  type MemAnalysisResponse,
  type MepAnalysisResponse,
  type WorkspaceResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  getStoredWorkspace,
  persistSelectedWorkspace,
  rememberWorkspaceId,
} from "@/lib/workspaces";
import { buildPath, paths } from "@/routes/paths";
import { useWorkspaceDropdown } from "@/hooks/use-workspace-dropdown";
import { MetvDashboard } from "@/pages/dashboard/metv-dashboard";
import { MerDashboard } from "@/pages/dashboard/mer-dashboard";
import { MepDashboard } from "@/pages/dashboard/mep-dashboard";
import { MemDashboard } from "@/pages/dashboard/mem-dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Settings2 } from "lucide-react";
import { toast } from "sonner";

const INPUT_DISPLAY_FORMAT = "dd/MM/yyyy";

export function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens } = useAuth();

  const locationState = location.state as {
    workspace?: WorkspaceResponse;
  } | null;
  const workspaceFromState = locationState?.workspace;

  const {
    selectedWorkspace,
    selectWorkspace,
    workspaces,
    loading: loadingWorkspaces,
  } = useWorkspaceDropdown({
    accessToken: tokens?.access,
    initialWorkspace: workspaceFromState,
    workspaceId,
  });

  useEffect(() => {
    if (workspaceId) {
      if (workspaceFromState) {
        persistSelectedWorkspace(workspaceFromState);
      } else {
        rememberWorkspaceId(workspaceId);
      }
      return;
    }

    const stored = getStoredWorkspace();
    if (stored.workspaceId) {
      navigate(buildPath.dashboard(stored.workspaceId), { replace: true });
    } else {
      navigate(paths.workspaces, { replace: true });
    }
  }, [workspaceId, workspaceFromState, navigate]);

  const [ddaData, setDdaData] = useState(null);
  const [mepData, setMepData] = useState<MepAnalysisResponse | null>(null);
  const [ddaError, setDdaError] = useState<string | null>(null);
  const [ddaLoading, setDdaLoading] = useState(false);
  const [memData, setMemData] = useState<MemAnalysisResponse | null>(null);

  const [selectedSectorOverride, setSelectedSectorOverride] = useState<string | null>(null);
  const [selectedChannelOverride, setSelectedChannelOverride] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sectorOptions, setSectorOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [sectorError, setSectorError] = useState<string | null>(null);
  const [channelOptions, setChannelOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [modalSectorValue, setModalSectorValue] = useState("");
  const [modalChannelValue, setModalChannelValue] = useState("");
  const [modalFromDate, setModalFromDate] = useState<Date | undefined>(undefined);
  const [modalToDate, setModalToDate] = useState<Date | undefined>(undefined);
  const [selectedRangeOverride, setSelectedRangeOverride] = useState<{ from: string; to: string } | null>(null);

  const workspaceProducts = useMemo(
    () => selectedWorkspace?.products_details ?? [],
    [selectedWorkspace?.products_details]
  );
  const activeProduct = workspaceProducts[0] ?? null;
  const productCode = activeProduct?.code
    ? String(activeProduct.code).trim().toLowerCase()
    : null;
  const isMetv = productCode === "metv";
  const isMer = productCode === "mer";
  const isMep = productCode === "mep";
  const isMem = productCode === "mem";
  const requiresBrandSelect = isMep;
  const needsChannelSelection = isMetv || isMer || requiresBrandSelect;
  const canConfigureFilters = isMetv || isMer || isMep || isMem;

  const channelSelectLabel = useMemo(() => {
    if (requiresBrandSelect) return "Produit / marque";
    if (isMer) return "Station radio";
    return "Chaîne TV";
  }, [requiresBrandSelect, isMer]);
  const channelPlaceholder = useMemo(() => {
    if (requiresBrandSelect) return "Sélectionnez un produit / marque";
    if (isMer) return "Sélectionnez une station";
    return "Sélectionnez une chaîne";
  }, [requiresBrandSelect, isMer]);

  const displayDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const normalizeDate = useCallback((date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  }, []);

  const computeDefaultRange = useCallback(() => {
    const today = normalizeDate(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - 2030);
    const normalizedStart = normalizeDate(start);
    return { from: normalizedStart, to: today };
  }, [normalizeDate]);

  const toISODateString = useCallback(
    (date: Date) => normalizeDate(date).toISOString().split("T")[0],
    [normalizeDate]
  );

  const parseISODate = useCallback(
    (value: string) => {
      const [year, month, day] = value.split("-").map(Number);
      return normalizeDate(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
    },
    [normalizeDate]
  );

  const effectiveDateRange = useMemo(() => {
    const defaultRange = computeDefaultRange();
    const fromISO = selectedRangeOverride?.from ?? toISODateString(defaultRange.from);
    const toISO = selectedRangeOverride?.to ?? toISODateString(defaultRange.to);
    return { from: fromISO, to: toISO };
  }, [selectedRangeOverride, computeDefaultRange, toISODateString]);

  const effectiveDateLabel = useMemo(() => {
    return {
      from: displayDateFormatter.format(parseISODate(effectiveDateRange.from)),
      to: displayDateFormatter.format(parseISODate(effectiveDateRange.to)),
    };
  }, [effectiveDateRange, parseISODate, displayDateFormatter]);

  useEffect(() => {
    if (!needsChannelSelection || !tokens?.access) {
      setSectorOptions([]);
      setSectorError(null);
      setSectorLoading(false);
      return;
    }

    let active = true;

    setSectorLoading(true);
    setSectorError(null);

    fetchSectors(tokens.access)
      .then((response) => {
        if (!active) return;
        const options = (response.sectors ?? []).map((sectorName) => ({
          value: sectorName,
          label:
            sectorName.charAt(0).toUpperCase() +
            sectorName.slice(1).toLowerCase(),
        }));
        setSectorOptions(options);
      })
      .catch((error) => {
        if (!active) return;
        setSectorError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les secteurs."
        );
        setSectorOptions([]);
      })
      .finally(() => {
        if (!active) return;
        setSectorLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tokens?.access, isMetv, isMer, requiresBrandSelect]);

  const loadChannelOptions = useCallback(
    async (sectorValue: string, preselected?: string) => {
      const normalizedSector = sectorValue.trim();
      if (!tokens?.access || !normalizedSector) {
        setChannelOptions([]);
        return;
      }

      setChannelLoading(true);
      setChannelError(null);

      try {
        const activeChannelRaw = preselected ?? modalChannelValue;
        const activeChannelTrimmed = activeChannelRaw?.trim();

        if (isMetv || isMer) {
          const response = await fetchChainsBySector(normalizedSector, tokens.access);
          const chains = response.chaines ?? [];
          const filtered = isMer
            ? chains.filter((chain) => chain.toLowerCase().includes("radio"))
            : chains;
          const mapped = filtered.map((chain) => ({
            value: chain,
            label: chain,
          }));
          const next = [...mapped];
          if (
            activeChannelTrimmed &&
            !next.some((option) => option.value.trim() === activeChannelTrimmed)
          ) {
            next.unshift({
              value: activeChannelRaw,
              label: activeChannelRaw,
            });
          }
          setChannelOptions(next);
        } else if (requiresBrandSelect) {
          const response = await fetchBrandsBySector(normalizedSector, tokens.access);
          const brands = response.marques ?? [];
          const mapped = brands.map((brand) => ({
            value: brand,
            label: brand,
          }));
          const next = [...mapped];
          if (
            activeChannelTrimmed &&
            !next.some((option) => option.value.trim() === activeChannelTrimmed)
          ) {
            next.unshift({
              value: activeChannelRaw,
              label: activeChannelRaw,
            });
          }
          setChannelOptions(next);
        } else {
          setChannelOptions([]);
        }
      } catch (error) {
        setChannelError(
          error instanceof Error
            ? error.message
            : isMetv || isMer
            ? "Impossible de charger les chaînes."
            : "Impossible de charger les produits / marques."
        );
        setChannelOptions([]);
      } finally {
        setChannelLoading(false);
      }
    },
    [tokens?.access, requiresBrandSelect, modalChannelValue, isMetv, isMer]
  );

  useEffect(() => {
    if (!filterDialogOpen) {
      return;
    }

    if (!(isMetv || isMer || requiresBrandSelect)) {
      return;
    }

    if (!modalSectorValue) {
      setChannelOptions([]);
      setChannelError(null);
      return;
    }

    loadChannelOptions(modalSectorValue, modalChannelValue);
  }, [
    filterDialogOpen,
    modalSectorValue,
    modalChannelValue,
    loadChannelOptions,
    isMetv,
    isMer,
    requiresBrandSelect,
  ]);

  const effectiveSector =
    selectedSectorOverride ?? selectedWorkspace?.sector_activity ?? "";
  const effectiveChannel =
    selectedChannelOverride ?? selectedWorkspace?.id_client ?? "";
  const fetchSectorIdentifier = effectiveSector.trim();
  const fetchChannelIdentifier = effectiveChannel.trim();
  const isCustomFilterActive = Boolean(
    selectedSectorOverride || selectedChannelOverride || selectedRangeOverride
  );

  useEffect(() => {
    setSelectedSectorOverride(null);
    setSelectedChannelOverride(null);
    setSelectedRangeOverride(null);
    setModalSectorValue("");
    setModalChannelValue("");
    const defaultRange = computeDefaultRange();
    setModalFromDate(defaultRange.from);
    setModalToDate(defaultRange.to);
    setChannelOptions([]);
    setChannelError(null);
    setFilterDialogOpen(false);
  }, [selectedWorkspace?.id, computeDefaultRange]);

  useEffect(() => {
    if (!selectedWorkspace || !tokens?.access) {
      setDdaData(null);
      setMepData(null);
      setMemData(null);
      return;
    }

    if (productCode !== "metv") {
      setDdaData(null);
    }

    if (productCode !== "mep") {
      setMepData(null);
    }

    if (productCode !== "mem") {
      setMemData(null);
    }

    if (productCode !== "metv" && productCode !== "mep" && productCode !== "mem") {
      setDdaLoading(false);
      setDdaError(null);
      return;
    }

    setDdaLoading(true);
    setDdaError(null);

    if (productCode === "metv") {
      if (!fetchSectorIdentifier || !fetchChannelIdentifier) {
        setDdaData(null);
        setDdaLoading(false);
        return;
      }

      fetchDeepDiveAnalysis(
        productCode,
        fetchSectorIdentifier,
        fetchChannelIdentifier,
        effectiveDateRange.from,
        effectiveDateRange.to
      )
        .then((response) => {
          setDdaData(response);
          setMepData(null);
        })
        .catch((error) => {
          console.error("Failed to fetch deep dive analysis:", error);
          setDdaError(
            error instanceof Error ? error.message : "Analyse indisponible"
          );
          setDdaData(null);
        })
        .finally(() => setDdaLoading(false));
      return;
    }

    if (!fetchChannelIdentifier) {
      setMepData(null);
      setDdaLoading(false);
      return;
    }

    if (productCode === "mep") {
      if (!fetchChannelIdentifier) {
        setMepData(null);
        setDdaLoading(false);
        return;
      }

      fetchMepAnalysis(
        effectiveChannel,
        effectiveDateRange.from,
        effectiveDateRange.to
      )
        .then((response) => {
          setMepData(response);
          setDdaData(null);
          setMemData(null);
        })
        .catch((error) => {
          console.error("Failed to fetch MEP analysis:", error);
          setDdaError(
            error instanceof Error ? error.message : "Analyse indisponible"
          );
          setMepData(null);
        })
        .finally(() => setDdaLoading(false));
      return;
    }

    fetchMemAnalysis(effectiveDateRange.from, effectiveDateRange.to)
      .then((response) => {
        setMemData(response);
        setMepData(null);
        setDdaData(null);
      })
      .catch((error) => {
        console.error("Failed to fetch MEM analysis:", error);
        setDdaError(
          error instanceof Error ? error.message : "Analyse indisponible"
        );
        setMemData(null);
      })
      .finally(() => setDdaLoading(false));
  }, [
    selectedWorkspace?.id,
    tokens?.access,
    productCode,
    effectiveSector,
    effectiveChannel,
    effectiveDateRange.from,
    effectiveDateRange.to,
  ]);

  const workspaceLabel = useMemo(() => {
    if (selectedWorkspace) {
      return selectedWorkspace.name;
    }
    if (workspaceId) {
      return `Workspace #${workspaceId}`;
    }
    return "Aucun workspace sélectionné";
  }, [selectedWorkspace, workspaceId]);

  const handleWorkspaceSelect = (workspace: WorkspaceResponse) => {
    selectWorkspace(workspace);
    const isSame = workspaceId ? String(workspace.id) === workspaceId : false;
    navigate(buildPath.dashboard(workspace.id), { replace: isSame });
  };

  const handleOpenFilterDialog = () => {
    if (!selectedWorkspace) {
      return;
    }

    const baseSectorRaw =
      selectedSectorOverride ?? selectedWorkspace.sector_activity ?? "";
    const baseChannelRaw =
      selectedChannelOverride ?? selectedWorkspace.id_client ?? "";
    const baseSector = baseSectorRaw.trim();
    const baseChannel = baseChannelRaw.trim();
    const defaultRange = computeDefaultRange();
    const baseRange = selectedRangeOverride
      ? {
          from: parseISODate(selectedRangeOverride.from),
          to: parseISODate(selectedRangeOverride.to),
        }
      : defaultRange;

    setModalSectorValue(baseSector);
    setModalChannelValue(baseChannel);
    setModalFromDate(baseRange?.from);
    setModalToDate(baseRange?.to);
    setFilterDialogOpen(true);

    if ((isMetv || isMer || requiresBrandSelect) && baseSector) {
      loadChannelOptions(baseSector, baseChannel);
    } else {
      setChannelOptions([]);
    }
  };

  const handleApplyFilters = () => {
    if (needsChannelSelection && !modalSectorValue) {
      toast.error("Merci de sélectionner un secteur.");
      return;
    }

    const sanitizedChannel = modalChannelValue.trim();

    if (needsChannelSelection && !sanitizedChannel) {
      toast.error(
        requiresBrandSelect
          ? "Merci de sélectionner un produit / marque."
          : isMer
          ? "Merci de sélectionner une station."
          : "Merci de sélectionner une chaîne."
      );
      return;
    }

    if (!selectedWorkspace) {
      toast.error("Sélectionnez un workspace actif.");
      return;
    }

    if (!modalFromDate || !modalToDate) {
      toast.error("Merci de sélectionner une période complète.");
      return;
    }

    if (modalFromDate > modalToDate) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }

    const normalizedFrom = normalizeDate(modalFromDate);
    const normalizedTo = normalizeDate(modalToDate);
    const fromISO = toISODateString(normalizedFrom);
    const toISO = toISODateString(normalizedTo);
    const defaultRange = computeDefaultRange();
    const defaultFromISO = toISODateString(defaultRange.from);
    const defaultToISO = toISODateString(defaultRange.to);
    const isDefaultRange = fromISO === defaultFromISO && toISO === defaultToISO;

    const defaultSectorRaw = selectedWorkspace.sector_activity ?? "";
    const defaultChannelRaw = selectedWorkspace.id_client ?? "";
    const defaultSectorCanonical = defaultSectorRaw.trim();
    const defaultChannelCanonical = defaultChannelRaw.trim();
    const sectorValueCanonical = modalSectorValue.trim();
    const channelValueCanonical = sanitizedChannel;
    const nextSectorOverride =
      needsChannelSelection &&
      modalSectorValue &&
      sectorValueCanonical !== defaultSectorCanonical
        ? modalSectorValue
        : null;
    const nextChannelOverride =
      needsChannelSelection &&
      channelValueCanonical !== defaultChannelCanonical
        ? modalChannelValue
        : null;

    setSelectedSectorOverride(nextSectorOverride);
    setSelectedChannelOverride(nextChannelOverride);
    setSelectedRangeOverride(isDefaultRange ? null : { from: fromISO, to: toISO });
    setFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    if (!selectedWorkspace) {
      setSelectedSectorOverride(null);
      setSelectedChannelOverride(null);
      setModalSectorValue("");
      setModalChannelValue("");
      setSelectedRangeOverride(null);
      const defaultRange = computeDefaultRange();
      setModalFromDate(defaultRange.from);
      setModalToDate(defaultRange.to);
      setFilterDialogOpen(false);
      return;
    }

    const defaultSectorRaw = selectedWorkspace.sector_activity ?? "";
    const defaultChannelRaw = selectedWorkspace.id_client ?? "";
    const defaultSectorCanonical = defaultSectorRaw.trim();
    const defaultRange = computeDefaultRange();

    setSelectedSectorOverride(null);
    setSelectedChannelOverride(null);
    setSelectedRangeOverride(null);
    setModalSectorValue(defaultSectorRaw);
    setModalChannelValue(defaultChannelRaw);
    setModalFromDate(defaultRange.from);
    setModalToDate(defaultRange.to);
    setChannelError(null);
    if (needsChannelSelection && defaultSectorCanonical) {
      loadChannelOptions(defaultSectorRaw, defaultChannelRaw);
    } else {
      setChannelOptions([]);
    }
  };

  const channelIdentifier = fetchChannelIdentifier;
  const sectorIdentifier = fetchSectorIdentifier;

  if (!selectedWorkspace) {
    return (
      <DashboardShell>
        <div className="flex h-full flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Sélectionnez un workspace pour afficher un dashboard.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#0c6e85]">
            Salut {user?.first_name ?? "Utilisateur"},
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Bienvenue sur VDM !
          </h1>
        </div>
        {/* <div className="flex w-full flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end"> */}
        <div className="flex w-full flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-4">

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:border-[#0c6e85]/40"
                >
                  <span className="text-muted-foreground">Espace courant :</span>
                  <span className="max-w-[220px] truncate font-semibold text-foreground">
                    {workspaceLabel}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Vos espaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loadingWorkspaces ? (
                  <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
                ) : workspaces.length === 0 ? (
                  <DropdownMenuItem disabled>
                    Aucun workspace disponible
                  </DropdownMenuItem>
                ) : (
                  workspaces.map((workspace) => {
                    const isActive = selectedWorkspace?.id === workspace.id;
                    return (
                      <DropdownMenuItem
                        key={workspace.id}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleWorkspaceSelect(workspace);
                        }}
                        className={cn(
                          "flex flex-col items-start gap-0.5",
                          isActive &&
                            "bg-[#0c6e85]/10 text-[#0c6e85] focus:bg-[#0c6e85]/10"
                        )}
                      >
                        <span className="text-sm font-semibold">
                          {workspace.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {workspace.type_client ??
                            "Type d’organisation indéterminé"}
                        </span>
                      </DropdownMenuItem>
                    );
                  })
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    navigate(paths.workspaces);
                  }}
                >
                  Gérer mes workspaces
                  <DropdownMenuShortcut>↗</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canConfigureFilters ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleOpenFilterDialog}
                className={cn(
                  "h-10 w-10 rounded-xl border border-border/60 bg-white text-muted-foreground shadow-sm transition hover:border-[#0c6e85]/40 hover:text-[#0c6e85]",
                  isCustomFilterActive &&
                    "border-[#0c6e85] bg-[#0c6e85]/10 text-[#0c6e85]"
                )}
              >
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Configurer l&apos;analyse</span>
              </Button>
            ) : null}
          </div>
          {productCode === "metv" ? (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-xs text-muted-foreground">
                Période analysée : {effectiveDateLabel.from} → {effectiveDateLabel.to}
              </span>
              {isCustomFilterActive ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#0c6e85]">
                  Filtres personnalisés actifs
                </span>
              ) : null}
            </div>
          ) : productCode === "mer" ? (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-xs text-muted-foreground">
                Station suivie : {channelIdentifier || "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                Période : {effectiveDateLabel.from} → {effectiveDateLabel.to}
              </span>
              {isCustomFilterActive ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#0c6e85]">
                  Filtres personnalisés actifs
                </span>
              ) : null}
            </div>
          ) : productCode === "mep" ? (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-xs text-muted-foreground">
                Produit / marque suivi : {channelIdentifier || "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                Période : {effectiveDateLabel.from} → {effectiveDateLabel.to}
              </span>
              {isCustomFilterActive ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#0c6e85]">
                  Filtres personnalisés actifs
                </span>
              ) : null}
            </div>
          ) : productCode === "mem" ? (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-xs text-muted-foreground">
                Vue d&apos;ensemble chaîne / annonceurs
              </span>
              <span className="text-xs text-muted-foreground">
                Période : {effectiveDateLabel.from} → {effectiveDateLabel.to}
              </span>
              <span className="text-xs text-muted-foreground">
                Spots totaux :{" "}
                {memData?.global.nb_spots.toLocaleString("fr-FR") ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                Valorisation : {memData?.global.valorisation ?? "—"}
              </span>
              {isCustomFilterActive ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#0c6e85]">
                  Filtres personnalisés actifs
                </span>
              ) : null}
            </div>
          ) : null}

          </div>
        </div>
      </header>
      {canConfigureFilters ? (
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogContent size="lg" className="space-y-6">
            <DialogHeader>
              <DialogTitle>Paramétrer l'analyse</DialogTitle>
              <DialogDescription>
                {isMetv
                  ? "Ajustez le secteur suivi et la chaîne analysée pour ce workspace."
                  : isMer
                  ? "Ajustez le secteur suivi et la station analysée pour ce workspace."
                  : isMep
                  ? "Ajustez le secteur et le produit / marque analysés pour ce workspace MEP."
                  : "Sélectionnez un intervalle de dates pour explorer les tendances MEM."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              {needsChannelSelection ? (
                <div className="space-y-2">
                  <Label htmlFor="dda-sector" className="text-sm font-medium text-foreground">
                    Secteur analysé
                  </Label>
                  <Select
                    value={modalSectorValue || undefined}
                    onValueChange={(value) => {
                      setModalSectorValue(value);
                      setModalChannelValue("");
                    }}
                    disabled={sectorLoading}
                  >
                    <SelectTrigger
                      id="dda-sector"
                      className="rounded-xl border border-border/60 bg-white text-sm font-medium"
                    >
                      <SelectValue
                        placeholder={
                          sectorLoading ? "Chargement..." : "Sélectionnez un secteur"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorLoading ? (
                        <SelectItem value="__loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : sectorOptions.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          Aucun secteur disponible
                        </SelectItem>
                      ) : (
                        sectorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {sectorError ? (
                    <p className="text-xs font-medium text-destructive">{sectorError}</p>
                  ) : null}
                </div>
              ) : null}

              {needsChannelSelection ? (
                <div className="space-y-2">
                  <Label htmlFor="dda-channel" className="text-sm font-medium text-foreground">
                    {channelSelectLabel}
                  </Label>
                  <Select
                    value={modalChannelValue || undefined}
                    onValueChange={(value) => setModalChannelValue(value)}
                    disabled={!modalSectorValue.trim() || channelLoading}
                  >
                    <SelectTrigger
                      id="dda-channel"
                      className="rounded-xl border border-border/60 bg-white text-sm font-medium"
                    >
                      <SelectValue
                        placeholder={
                          !modalSectorValue.trim()
                            ? "Choisissez un secteur d'abord"
                            : channelLoading
                            ? "Chargement..."
                            : channelPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {channelLoading ? (
                        <SelectItem value="__loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : channelOptions.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          {modalSectorValue
                            ? "Aucune option disponible"
                            : "Sélectionnez d'abord un secteur"}
                        </SelectItem>
                      ) : (
                        channelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {channelError ? (
                    <p className="text-xs font-medium text-destructive">{channelError}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Période analysée
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DatePickerField
                    id="dda-date-from"
                    placeholder="JJ/MM/AAAA"
                    date={modalFromDate}
                    onChange={setModalFromDate}
                    normalizeDate={normalizeDate}
                  />
                  <DatePickerField
                    id="dda-date-to"
                    placeholder="JJ/MM/AAAA"
                    date={modalToDate}
                    onChange={setModalToDate}
                    normalizeDate={normalizeDate}
                  />
                </div>
                {!modalFromDate || !modalToDate ? (
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez un intervalle de dates complet.
                  </p>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFilterDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
              >
                Revenir au workspace
              </Button>
              <Button
                type="button"
                onClick={handleApplyFilters}
                disabled={
                  (needsChannelSelection &&
                    (!modalSectorValue.trim() ||
                      !modalChannelValue.trim() ||
                      channelLoading)) ||
                  !modalFromDate ||
                  !modalToDate
                }
                className="bg-[#0c6e85] text-white hover:bg-[#0a5a6c]"
              >
                Appliquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      {productCode === "metv" ? (
        <MetvDashboard
          ddaData={ddaData}
          channelIdentifier={channelIdentifier}
          sectorIdentifier={sectorIdentifier}
        />
      ) : productCode === "mer" ? (
        <MerDashboard
          ddaData={ddaData}
          stationIdentifier={channelIdentifier}
          sectorIdentifier={sectorIdentifier}
        />
      ) : productCode === "mep" ? (
        <MepDashboard
          data={mepData}
          annonceurIdentifier={channelIdentifier || "—"}
          sectorIdentifier={sectorIdentifier || "—"}
        />
      ) : productCode === "mem" ? (
        <MemDashboard
          data={memData}
        />
      ) : (
        <ComingSoonDashboard productName={activeProduct?.name ?? null} />
      )}
    </DashboardShell>
  );
}

function ComingSoonDashboard({ productName }: { productName: string | null }) {
  return (
    <section className="mt-10 flex flex-1 items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl border border-dashed border-muted-foreground/30 bg-muted/20 p-10 text-center shadow-sm">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Dashboard en préparation
          </h2>
          <p className="text-sm text-muted-foreground">
            Le tableau de bord pour{" "}
            <span className="font-medium text-foreground">
              {productName ?? "ce produit"}
            </span>{" "}
            est en cours de conception. Revenez bientôt pour découvrir de
            nouvelles analyses.
          </p>
        </div>
      </div>
    </section>
  );
}

interface DatePickerFieldProps {
  id: string;
  placeholder: string;
  date: Date | undefined;
  onChange: (next: Date | undefined) => void;
  normalizeDate: (date: Date) => Date;
}

function DatePickerField({ id, placeholder, date, onChange, normalizeDate }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => date ?? new Date());

  useEffect(() => {
    if (date) {
      const normalized = normalizeDate(date);
      setMonth(normalized);
    } else {
    }
  }, [date, normalizeDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm font-medium text-foreground hover:border-[#0c6e85]/40 sm:w-auto"
        >
          {date ? format(normalizeDate(date), INPUT_DISPLAY_FORMAT) : placeholder}
          <CalendarIcon className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={date}
          captionLayout="dropdown"
          onSelect={(selected) => {
            if (!selected) {
              onChange(undefined);
              return;
            }
            const normalized = normalizeDate(selected);
            onChange(normalized);
            setMonth(normalized);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

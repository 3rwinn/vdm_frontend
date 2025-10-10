import { useCallback, useEffect, useMemo, useState } from "react";
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
  fetchSectors,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

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
  const [ddaError, setDdaError] = useState<string | null>(null);
  const [ddaLoading, setDdaLoading] = useState(false);

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

  console.log("ddaData", ddaData);

  const workspaceProducts = useMemo(
    () => selectedWorkspace?.products_details ?? [],
    [selectedWorkspace?.products_details]
  );
  const activeProduct = workspaceProducts[0] ?? null;
  const productCode = activeProduct?.code
    ? String(activeProduct.code).toLowerCase()
    : null;
  const requiresBrandSelect = useMemo(() => productCode === "mep", [productCode]);

  console.log("workspaceProducts", workspaceProducts);

  const channelSelectLabel = useMemo(
    () => (requiresBrandSelect ? "Marque / produit" : "Chaîne"),
    [requiresBrandSelect]
  );
  const channelPlaceholder = requiresBrandSelect
    ? "Sélectionnez une marque"
    : "Sélectionnez une chaîne";

  useEffect(() => {
    if (productCode !== "metv" || !tokens?.access) {
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
  }, [tokens?.access, productCode]);

  const loadChannelOptions = useCallback(
    async (sectorValue: string, preselected?: string) => {
      if (productCode !== "metv") {
        setChannelOptions([]);
        setChannelError(null);
        setChannelLoading(false);
        return;
      }

      if (!tokens?.access || !sectorValue) {
        setChannelOptions([]);
        return;
      }

      setChannelLoading(true);
      setChannelError(null);

      try {
        const activeChannel = preselected ?? modalChannelValue;

        if (requiresBrandSelect) {
          const response = await fetchBrandsBySector(sectorValue, tokens.access);
          const brands = response.marques ?? [];
          const mapped = brands.map((brand) => ({
            value: brand,
            label: brand,
          }));
          const next = [...mapped];
          if (
            activeChannel &&
            !next.some((option) => option.value === activeChannel)
          ) {
            next.unshift({
              value: activeChannel,
              label: activeChannel,
            });
          }
          setChannelOptions(next);
        } else {
          const response = await fetchChainsBySector(sectorValue, tokens.access);
          const chains = response.chaines ?? [];
          const mapped = chains.map((chain) => ({
            value: chain,
            label: chain,
          }));
          const next = [...mapped];
          if (
            activeChannel &&
            !next.some((option) => option.value === activeChannel)
          ) {
            next.unshift({
              value: activeChannel,
              label: activeChannel,
            });
          }
          setChannelOptions(next);
        }
      } catch (error) {
        setChannelError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les chaînes."
        );
        setChannelOptions([]);
      } finally {
        setChannelLoading(false);
      }
    },
    [tokens?.access, requiresBrandSelect, modalChannelValue, productCode]
  );

  useEffect(() => {
    if (!filterDialogOpen) {
      return;
    }

    if (!modalSectorValue) {
      setChannelOptions([]);
      setChannelError(null);
      return;
    }

    loadChannelOptions(modalSectorValue, modalChannelValue);
  }, [filterDialogOpen, modalSectorValue, modalChannelValue, loadChannelOptions]);

  useEffect(() => {
    setSelectedSectorOverride(null);
    setSelectedChannelOverride(null);
    setModalSectorValue("");
    setModalChannelValue("");
    setChannelOptions([]);
    setChannelError(null);
    setFilterDialogOpen(false);
  }, [selectedWorkspace?.id]);

  useEffect(() => {
    if (!selectedWorkspace || !tokens?.access) {
      setDdaData(null);
      return;
    }

    if (productCode !== "metv") {
      setDdaData(null);
      return;
    }

    const sector =
      selectedSectorOverride ?? selectedWorkspace.sector_activity ?? "";
    const channel =
      selectedChannelOverride ?? selectedWorkspace.id_client ?? "";

    if (!sector || !channel) {
      setDdaData(null);
      return;
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 2030);

    const format = (date: Date) => date.toISOString().split("T")[0];
    setDdaLoading(true);
    setDdaError(null);

    fetchDeepDiveAnalysis("metv", sector, channel, format(start), format(end))
      .then((response) => {
        setDdaData(response);
        console.log("Deep Dive Analysis response:", response);
      })
      .catch((error) => {
        console.error("Failed to fetch deep dive analysis:", error);
        setDdaError(
          error instanceof Error ? error.message : "Analyse indisponible"
        );
        setDdaData(null);
      })
      .finally(() => setDdaLoading(false));
  }, [
    selectedWorkspace,
    tokens?.access,
    selectedSectorOverride,
    selectedChannelOverride,
    productCode,
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

  const effectiveSector =
    selectedSectorOverride ?? selectedWorkspace?.sector_activity ?? "";
  const effectiveChannel =
    selectedChannelOverride ?? selectedWorkspace?.id_client ?? "";
  const isCustomFilterActive = Boolean(
    selectedSectorOverride || selectedChannelOverride
  );

  const handleOpenFilterDialog = () => {
    if (!selectedWorkspace) {
      return;
    }

    const baseSector =
      selectedSectorOverride ?? selectedWorkspace.sector_activity ?? "";
    const baseChannel =
      selectedChannelOverride ?? selectedWorkspace.id_client ?? "";

    setModalSectorValue(baseSector);
    setModalChannelValue(baseChannel);
    setFilterDialogOpen(true);

    if (baseSector) {
      loadChannelOptions(baseSector, baseChannel);
    } else {
      setChannelOptions([]);
    }
  };

  const handleApplyFilters = () => {
    if (!modalSectorValue || !modalChannelValue) {
      toast.error("Merci de sélectionner un secteur et une chaîne.");
      return;
    }

    setSelectedSectorOverride(modalSectorValue);
    setSelectedChannelOverride(modalChannelValue);
    setFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    if (!selectedWorkspace) {
      setSelectedSectorOverride(null);
      setSelectedChannelOverride(null);
      setModalSectorValue("");
      setModalChannelValue("");
      setFilterDialogOpen(false);
      return;
    }

    const defaultSector = selectedWorkspace.sector_activity ?? "";
    const defaultChannel = selectedWorkspace.id_client ?? "";

    setSelectedSectorOverride(null);
    setSelectedChannelOverride(null);
    setModalSectorValue(defaultSector);
    setModalChannelValue(defaultChannel);
    setChannelError(null);
    if (defaultSector) {
      loadChannelOptions(defaultSector, defaultChannel);
    } else {
      setChannelOptions([]);
    }
  };

  const channelIdentifier = effectiveChannel;
  const sectorIdentifier = effectiveSector;

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
        <div className="flex w-full flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
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
            {productCode === "metv" ? (
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
                <span className="sr-only">Modifier les filtres DDA</span>
              </Button>
            ) : null}
          </div>
          {productCode === "metv" && isCustomFilterActive ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0c6e85]">
              Filtres personnalisés actifs
            </span>
          ) : null}
        </div>
      </header>
      {productCode === "metv" ? (
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogContent size="lg" className="space-y-6">
          <DialogHeader>
            <DialogTitle>Paramétrer l'analyse</DialogTitle>
            <DialogDescription>
              Ajustez le secteur suivi et la {requiresBrandSelect ? "marque" : "chaîne"} analysée pour ce
              tableau de bord.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
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
            <div className="space-y-2">
              <Label htmlFor="dda-channel" className="text-sm font-medium text-foreground">
                {channelSelectLabel}
              </Label>
              <Select
                value={modalChannelValue || undefined}
                onValueChange={(value) => setModalChannelValue(value)}
                disabled={!modalSectorValue || channelLoading}
              >
                <SelectTrigger
                  id="dda-channel"
                  className="rounded-xl border border-border/60 bg-white text-sm font-medium"
                >
                  <SelectValue
                    placeholder={
                      !modalSectorValue
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
                !modalSectorValue || !modalChannelValue || channelLoading
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

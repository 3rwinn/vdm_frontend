import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarIcon, FileDown, Loader2, Settings2, SlidersHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

import { useAuth } from "@/hooks/use-auth"
import { useWorkspaceDropdown } from "@/hooks/use-workspace-dropdown"
import {
  downloadPigeReport,
  fetchReportsData,
  type CleanDataRecord,
  type ReportsQueryParams,
} from "@/lib/api"
import { getStoredWorkspace } from "@/lib/workspaces"
import { paths } from "@/routes/paths"
import { cn, formatCurrency } from "@/lib/utils"

type ReportFilterState = {
  sector: string
  channel: string
  advertiser: string
  marque: string
  stationType: string
  search: string
  from: string | null
  to: string | null
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const INPUT_DISPLAY_FORMAT = "dd/MM/yyyy"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—"
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "—"
  }
  return dateTimeFormatter.format(parsed)
}

function formatDurationFromSeconds(seconds?: number | null) {
  const total = Number.isFinite(seconds) && seconds ? Math.max(0, Math.round(seconds)) : 0
  if (total === 0) {
    return "0s"
  }
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const parts: string[] = []
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (secs) parts.push(`${secs}s`)
  return parts.join(" ")
}

function uniqueSortedValues(
  data: CleanDataRecord[],
  accessor: (row: CleanDataRecord) => string | null
) {
  const values = new Set<string>()
  data.forEach((row) => {
    const value = accessor(row)
    if (value && value.trim()) {
      values.add(value.trim())
    }
  })
  return Array.from(values).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base", ignorePunctuation: true })
  )
}

function coerceNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ReportsPage() {
  const navigate = useNavigate()
  const { tokens } = useAuth()
  const { selectedWorkspace, selectWorkspace, workspaces, loading } =
    useWorkspaceDropdown({
      accessToken: tokens?.access,
    })

  useEffect(() => {
    const stored = getStoredWorkspace()
    if (!stored.workspaceId) {
      navigate(paths.workspaces, { replace: true })
      return
    }
    if (!selectedWorkspace && stored.workspace) {
      selectWorkspace(stored.workspace)
    }
  }, [navigate, selectWorkspace, selectedWorkspace])

  const workspaceProducts = useMemo(
    () => selectedWorkspace?.products_details ?? [],
    [selectedWorkspace?.products_details]
  )
  const activeProduct = workspaceProducts[0] ?? null
  const productCode = activeProduct?.code
    ? String(activeProduct.code).trim().toLowerCase()
    : null
  const isMetv = productCode === "metv"
  const isMer = productCode === "mer"
  const isMep = productCode === "mep"
  const isMem = productCode === "mem"
  const supportsPigeDownload = isMetv || isMer || isMep

  const defaultFilters = useMemo<ReportFilterState>(() => {
    const baseSector = selectedWorkspace?.sector_activity?.trim() ?? ""
    const baseClient = selectedWorkspace?.id_client?.trim() ?? ""

    if (isMetv || isMer) {
      return {
        sector: baseSector,
        channel: baseClient,
        advertiser: "",
        marque: "",
        stationType: "",
        search: "",
        from: null,
        to: null,
      }
    }

    if (isMep) {
      return {
        sector: baseSector,
        channel: "",
        advertiser: baseClient,
        marque: "",
        stationType: "",
        search: "",
        from: null,
        to: null,
      }
    }

    return {
      sector: baseSector,
      channel: "",
      advertiser: "",
      marque: "",
      stationType: "",
      search: "",
      from: null,
      to: null,
    }
  }, [selectedWorkspace, isMetv, isMer, isMep])

  const normalizeDate = useCallback((date: Date) => {
    const normalized = new Date(date)
    normalized.setHours(12, 0, 0, 0)
    return normalized
  }, [])

  const toISODateString = useCallback(
    (date: Date) => normalizeDate(date).toISOString().split("T")[0],
    [normalizeDate]
  )

  const parseISODate = useCallback(
    (value: string | null) => {
      if (!value) return undefined
      const [year, month, day] = value.split("-").map(Number)
      if (!year || !month || !day) {
        return undefined
      }
      return normalizeDate(new Date(year, month - 1, day))
    },
    [normalizeDate]
  )

  const [formFilters, setFormFilters] = useState<ReportFilterState>(defaultFilters)
  const [activeFilters, setActiveFilters] = useState<ReportFilterState>(defaultFilters)
  const [rawData, setRawData] = useState<CleanDataRecord[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState<number>(1)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [tableSearch, setTableSearch] = useState("")
  const [valorizationOperator, setValorizationOperator] = useState<"any" | "gt" | "eq" | "lt">("any")
  const [valorizationAmount, setValorizationAmount] = useState("")
  const [pigeLoading, setPigeLoading] = useState(false)

  useEffect(() => {
    setFormFilters({ ...defaultFilters })
    setActiveFilters({ ...defaultFilters })
    setPage(1)
  }, [defaultFilters])

  useEffect(() => {
    if (!tokens?.access || !productCode || !selectedWorkspace) {
      return
    }

    const trimmedSector = activeFilters.sector.trim()
    const trimmedChannel = activeFilters.channel.trim()
    const trimmedAdvertiser = activeFilters.advertiser.trim()

    if ((isMetv || isMer) && (!trimmedSector || !trimmedChannel)) {
      setError("Complétez le secteur et la chaîne pour consulter les rapports.")
      setRawData([])
      setLoadingData(false)
      return
    }

    if (isMep && (!trimmedSector || !trimmedAdvertiser)) {
      setError("Complétez le secteur et l'annonceur pour consulter les rapports.")
      setRawData([])
      setLoadingData(false)
      return
    }

    let cancelled = false
    setLoadingData(true)
    setError(null)

    const payload: ReportsQueryParams = {
      sector: trimmedSector || undefined,
      channel: trimmedChannel || undefined,
      advertiser: trimmedAdvertiser || undefined,
      marque: activeFilters.marque || undefined,
      stationType: activeFilters.stationType || undefined,
      search: activeFilters.search || undefined,
      from: activeFilters.from || undefined,
      to: activeFilters.to || undefined,
    }

    fetchReportsData(productCode, payload, tokens.access)
      .then((response) => {
        if (cancelled) return
        setRawData(response.datas ?? [])
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return
        setRawData([])
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Impossible de charger les rapports pour le moment."
        )
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingData(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    activeFilters,
    productCode,
    tokens?.access,
    selectedWorkspace,
    isMetv,
    isMer,
    isMep,
  ])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    setPage(1)
  }, [tableSearch, valorizationOperator, valorizationAmount])

  const filteredData = useMemo(() => {
    const searchTerm = activeFilters.search.trim().toLowerCase()
    const normalizedSector = activeFilters.sector.trim().toLowerCase()
    const normalizedChannel = activeFilters.channel.trim().toLowerCase()
    const normalizedAdvertiser = activeFilters.advertiser.trim().toLowerCase()
    const normalizedMarque = activeFilters.marque.trim().toLowerCase()
    const normalizedStation = activeFilters.stationType.trim().toLowerCase()

    const quickTerm = tableSearch.trim().toLowerCase()
    const sanitizedValorization = valorizationAmount.replace(/\s/g, "").replace(",", ".")
    const valorizationNumber = Number(sanitizedValorization)
    const hasValorizationFilter =
      valorizationOperator !== "any" &&
      sanitizedValorization !== "" &&
      Number.isFinite(valorizationNumber)

    const fromDate = activeFilters.from
      ? new Date(`${activeFilters.from}T00:00:00`)
      : null
    const toDate = activeFilters.to
      ? new Date(`${activeFilters.to}T23:59:59`)
      : null

    return rawData.filter((row) => {
      const sectorLabel = row.secteur_activite?.trim().toLowerCase() ?? ""
      const channelLabel = row.chaine?.trim().toLowerCase() ?? ""
      const advertiserLabel = row.annonceur?.trim().toLowerCase() ?? ""
      const marqueLabel = row.marque?.trim().toLowerCase() ?? ""
      const stationLabel = row.station_type?.trim().toLowerCase() ?? ""

      if (normalizedSector && sectorLabel !== normalizedSector) {
        return false
      }
      if (normalizedChannel && channelLabel !== normalizedChannel) {
        return false
      }
      if (normalizedAdvertiser && advertiserLabel !== normalizedAdvertiser) {
        return false
      }
      if (normalizedMarque && marqueLabel !== normalizedMarque) {
        return false
      }
      if (normalizedStation && stationLabel !== normalizedStation) {
        return false
      }

      const spotDate = new Date(row.date_debut)
      if (fromDate && (Number.isNaN(spotDate.getTime()) || spotDate < fromDate)) {
        return false
      }
      if (toDate && (Number.isNaN(spotDate.getTime()) || spotDate > toDate)) {
        return false
      }

      if (searchTerm) {
        const haystack = [
          row.titre,
          row.marque,
          row.annonceur,
          row.chaine,
          row.station_type,
        ]
          .map((value) => value?.toLowerCase() ?? "")
          .join(" ")
        if (!haystack.includes(searchTerm)) {
          return false
        }
      }

      if (quickTerm) {
        const quickHaystack = [
          row.marque?.toLowerCase() ?? "",
          row.titre?.toLowerCase() ?? "",
        ]
        if (!quickHaystack.some((value) => value.includes(quickTerm))) {
          return false
        }
      }

      if (hasValorizationFilter) {
        const valorizationValue = coerceNumber(row.valorization)
        if (
          (valorizationOperator === "gt" && !(valorizationValue > valorizationNumber)) ||
          (valorizationOperator === "lt" && !(valorizationValue < valorizationNumber)) ||
          (valorizationOperator === "eq" && !(valorizationValue === valorizationNumber))
        ) {
          return false
        }
      }

      return true
    })
  }, [
    rawData,
    activeFilters,
    tableSearch,
    valorizationAmount,
    valorizationOperator,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const pagination = useMemo(() => {
    if (filteredData.length === 0) {
      return { start: 0, end: 0, items: [] as CleanDataRecord[] }
    }
    const start = (page - 1) * pageSize
    const end = Math.min(filteredData.length, start + pageSize)
    return {
      start,
      end,
      items: filteredData.slice(start, end),
    }
  }, [filteredData, page, pageSize])

  const displayedPages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const pages: Array<number | "ellipsis"> = [1]
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    if (start > 2) {
      pages.push("ellipsis")
    }

    for (let current = start; current <= end; current += 1) {
      pages.push(current)
    }

    if (end < totalPages - 1) {
      pages.push("ellipsis")
    }

    pages.push(totalPages)
    return pages
  }, [page, totalPages])

  const marqueOptions = useMemo(() => {
    const values = uniqueSortedValues(rawData, (row) => row.marque)
    if (formFilters.marque && !values.includes(formFilters.marque)) {
      values.push(formFilters.marque)
    }
    return values.sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base", ignorePunctuation: true })
    )
  }, [rawData, formFilters.marque])

  const stationTypeOptions = useMemo(() => {
    const values = uniqueSortedValues(rawData, (row) => row.station_type)
    if (formFilters.stationType && !values.includes(formFilters.stationType)) {
      values.push(formFilters.stationType)
    }
    return values.sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base", ignorePunctuation: true })
    )
  }, [rawData, formFilters.stationType])

  const annonceurOptions = useMemo(
    () => uniqueSortedValues(rawData, (row) => row.annonceur),
    [rawData]
  )

  const chaineOptions = useMemo(
    () => uniqueSortedValues(rawData, (row) => row.chaine),
    [rawData]
  )

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (open) {
        setFormFilters({ ...activeFilters })
      }
      setFilterDialogOpen(open)
    },
    [activeFilters]
  )

  const handleOpenFilterDialog = useCallback(() => {
    handleDialogChange(true)
  }, [handleDialogChange])

  const handleApplyFilters = useCallback(() => {
    const trimmedSector = formFilters.sector.trim()
    const trimmedChannel = formFilters.channel.trim()
    const trimmedAdvertiser = formFilters.advertiser.trim()

    if ((isMetv || isMer) && (!trimmedSector || !trimmedChannel)) {
      toast.error("Merci de renseigner le secteur et la chaîne à analyser.")
      return
    }

    if (isMep && (!trimmedSector || !trimmedAdvertiser)) {
      toast.error("Merci de renseigner le secteur et l'annonceur suivi.")
      return
    }

    if (
      formFilters.from &&
      formFilters.to &&
      formFilters.from > formFilters.to
    ) {
      toast.error("La date de fin doit être postérieure à la date de début.")
      return
    }

    setActiveFilters({
      ...formFilters,
      sector: trimmedSector,
      channel: trimmedChannel,
      advertiser: trimmedAdvertiser,
    })
    setPage(1)
    handleDialogChange(false)
  }, [formFilters, isMetv, isMer, isMep, handleDialogChange])

  const handleResetFilters = useCallback(() => {
    setFormFilters({ ...defaultFilters })
    setActiveFilters({ ...defaultFilters })
    setPage(1)
    setError(null)
  }, [defaultFilters])

  const handleCancelFilters = useCallback(() => {
    setFormFilters({ ...activeFilters })
    handleDialogChange(false)
  }, [activeFilters, handleDialogChange])

  const inlineFiltersPristine = useMemo(
    () =>
      tableSearch.trim() === "" &&
      valorizationOperator === "any" &&
      valorizationAmount.trim() === "",
    [tableSearch, valorizationOperator, valorizationAmount]
  )

  const handleResetInlineFilters = useCallback(() => {
    setTableSearch("")
    setValorizationOperator("any")
    setValorizationAmount("")
  }, [])

  const handleDownloadPige = useCallback(async () => {
    if (!supportsPigeDownload) {
      return
    }

    const trimmedSector = activeFilters.sector.trim()
    if (!trimmedSector) {
      toast.error("Sélectionnez un secteur avant de générer le rapport PIGE.")
      return
    }

    const isChannelReport = isMetv || isMer
    const trimmedChannel = activeFilters.channel.trim()
    const trimmedAdvertiser = activeFilters.advertiser.trim()

    if (isChannelReport && !trimmedChannel) {
      toast.error("Sélectionnez une chaîne pour générer le rapport PIGE.")
      return
    }

    if (isMep && !trimmedAdvertiser) {
      toast.error("Sélectionnez un annonceur pour générer le rapport PIGE.")
      return
    }

    if (!tokens?.access) {
      toast.error("Connexion requise pour télécharger le rapport.")
      return
    }

    setPigeLoading(true)
    try {
      const type = isChannelReport ? "channel" : "advertiser"
      const identifier = isChannelReport ? trimmedChannel : trimmedAdvertiser

      const blob = await downloadPigeReport({
        type,
        sector: trimmedSector,
        identifier,
        token: tokens.access,
      })

      const cleanIdentifier =
        identifier.replace(/\s+/g, "_").toLowerCase() || "rapport"
      const filename = `rapport_pige_${cleanIdentifier}.pdf`
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success("Rapport PIGE généré avec succès.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de générer le rapport PIGE."
      toast.error(message)
    } finally {
      setPigeLoading(false)
    }
  }, [
    supportsPigeDownload,
    activeFilters,
    isMetv,
    isMer,
    isMep,
    tokens?.access,
  ])

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const bounded = Math.min(Math.max(1, nextPage), totalPages)
      setPage(bounded)
    },
    [totalPages]
  )

  const handlePageSizeChange = useCallback((value: string) => {
    const parsed = Number(value)
    setPageSize(Number.isFinite(parsed) && parsed > 0 ? parsed : PAGE_SIZE_OPTIONS[0])
  }, [])

  const workspaceLabel =
    selectedWorkspace?.name ?? "Aucun workspace sélectionné"
  const productLabel = activeProduct?.name ?? "Produit non configuré"
  const productCodeLabel = productCode ? productCode.toUpperCase() : "—"

  const periodLabel = useMemo(() => {
    const fromLabel = activeFilters.from
      ? dateFormatter.format(new Date(`${activeFilters.from}T00:00:00`))
      : "—"
    const toLabel = activeFilters.to
      ? dateFormatter.format(new Date(`${activeFilters.to}T00:00:00`))
      : "—"
    return { from: fromLabel, to: toLabel }
  }, [activeFilters.from, activeFilters.to])

  const isCustomFiltersActive = useMemo(() => {
    return JSON.stringify(activeFilters) !== JSON.stringify(defaultFilters)
  }, [activeFilters, defaultFilters])

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#0c6e85]">
            Rapports &amp; historiques
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Analyse détaillée des diffusions
          </h1>
          <p className="text-sm text-muted-foreground">
            Produit actif :{" "}
            <span className="font-medium text-foreground">
              {productLabel}
            </span>{" "}
            {/* · Code&nbsp;
            <span className="font-semibold text-foreground">
              {productCodeLabel}
            </span> */}
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:border-[#0c6e85]/40"
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
              {loading ? (
                <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
              ) : workspaces.length === 0 ? (
                <DropdownMenuItem disabled>
                  Aucun workspace disponible
                </DropdownMenuItem>
              ) : (
                workspaces.map((workspace) => {
                  const isActive = selectedWorkspace?.id === workspace.id
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onSelect={(event) => {
                        event.preventDefault()
                        selectWorkspace(workspace)
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
                        {workspace.type_client ?? "Type d’organisation indéterminé"}
                      </span>
                    </DropdownMenuItem>
                  )
                })
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  navigate(paths.workspaces)
                }}
              >
                Gérer mes workspaces
                <DropdownMenuShortcut>↗</DropdownMenuShortcut>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleOpenFilterDialog}
            className={cn(
              "h-10 w-10 rounded-xl border border-border/60 bg-white text-muted-foreground shadow-sm transition hover:border-[#0c6e85]/40 hover:text-[#0c6e85]",
              isCustomFiltersActive &&
                "border-[#0c6e85] bg-[#0c6e85]/10 text-[#0c6e85]"
            )}
          >
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Configurer les filtres</span>
          </Button>
        </div>
      </header>

      {supportsPigeDownload ? (
        <div className="mb-6 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleDownloadPige}
            disabled={pigeLoading}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c6e85] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#0a5a6c]"
          >
            {pigeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Télécharger le rapport PIGE
          </Button>
        </div>
      ) : null}

      <Dialog open={filterDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent size="lg" className="space-y-6">
          <DialogHeader>
            <DialogTitle>Paramétrer les rapports</DialogTitle>
            <DialogDescription>
              Ajustez vos critères pour explorer les diffusions les plus pertinentes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="filter-sector">Secteur analysé</Label>
                <Input
                  id="filter-sector"
                  placeholder="Secteur (ex : Agroalimentaire)"
                  value={formFilters.sector}
                  onChange={(event) =>
                    setFormFilters((prev) => ({
                      ...prev,
                      sector: event.target.value,
                    }))
                  }
                />
              </div>
              {(isMetv || isMer) && (
                <div className="space-y-1.5">
                  <Label htmlFor="filter-channel">Chaîne suivie</Label>
                  <Input
                    id="filter-channel"
                    placeholder="Chaîne (ex : RTI2)"
                    value={formFilters.channel}
                    onChange={(event) =>
                      setFormFilters((prev) => ({
                        ...prev,
                        channel: event.target.value,
                      }))
                    }
                  />
                </div>
              )}
              {isMep && (
                <div className="space-y-1.5">
                  <Label htmlFor="filter-advertiser">Annonceur suivi</Label>
                  <Input
                    id="filter-advertiser"
                    placeholder="Annonceur (ex : Unilever)"
                    value={formFilters.advertiser}
                    onChange={(event) =>
                      setFormFilters((prev) => ({
                        ...prev,
                        advertiser: event.target.value,
                      }))
                    }
                  />
                </div>
              )}
              {isMem ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="filter-channel-mem">Chaîne (optionnel)</Label>
                    <Select
                      value={formFilters.channel || "all"}
                      onValueChange={(value) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          channel: value === "all" ? "" : value,
                        }))
                      }
                      disabled={chaineOptions.length === 0}
                    >
                      <SelectTrigger id="filter-channel-mem">
                        <SelectValue placeholder="Toutes les chaînes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les chaînes</SelectItem>
                        {chaineOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="filter-advertiser-mem">
                      Annonceur (optionnel)
                    </Label>
                    <Select
                      value={formFilters.advertiser || "all"}
                      onValueChange={(value) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          advertiser: value === "all" ? "" : value,
                        }))
                      }
                      disabled={annonceurOptions.length === 0}
                    >
                      <SelectTrigger id="filter-advertiser-mem">
                        <SelectValue placeholder="Tous les annonceurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les annonceurs</SelectItem>
                        {annonceurOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="filter-station">Type de station</Label>
                    <Select
                      value={formFilters.stationType || "all"}
                      onValueChange={(value) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          stationType: value === "all" ? "" : value,
                        }))
                      }
                      disabled={stationTypeOptions.length === 0}
                    >
                      <SelectTrigger id="filter-station">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {stationTypeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="filter-marque">Produit / marque</Label>
                <Select
                  value={formFilters.marque || "all"}
                  onValueChange={(value) =>
                    setFormFilters((prev) => ({
                      ...prev,
                      marque: value === "all" ? "" : value,
                    }))
                  }
                  disabled={marqueOptions.length === 0}
                >
                  <SelectTrigger id="filter-marque">
                    <SelectValue placeholder="Toutes les marques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les marques</SelectItem>
                    {marqueOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="filter-from">Du</Label>
                <DatePickerField
                  id="filter-from"
                  placeholder="JJ/MM/AAAA"
                  date={parseISODate(formFilters.from)}
                  onChange={(next) =>
                    setFormFilters((prev) => ({
                      ...prev,
                      from: next ? toISODateString(next) : null,
                    }))
                  }
                  normalizeDate={normalizeDate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-to">Au</Label>
                <DatePickerField
                  id="filter-to"
                  placeholder="JJ/MM/AAAA"
                  date={parseISODate(formFilters.to)}
                  onChange={(next) =>
                    setFormFilters((prev) => ({
                      ...prev,
                      to: next ? toISODateString(next) : null,
                    }))
                  }
                  normalizeDate={normalizeDate}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={handleCancelFilters}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              disabled={loadingData}
            >
              Réinitialiser
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              disabled={loadingData}
              className="bg-[#0c6e85] text-white hover:bg-[#0a5a6c]"
            >
              {loadingData ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SlidersHorizontal className="mr-2 h-4 w-4" />
              )}
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="mt-8 space-y-8">
        <Card className="rounded-3xl border-none bg-white shadow-lg pt-0">
          <CardHeader className="rounded-t-3xl bg-gradient-to-br from-[#0d7f93] via-[#0a617a] to-[#09455f] p-6 space-y-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <CardDescription className="text-sm text-white">
                {filteredData.length.toLocaleString("fr-FR")} spots correspondent aux paramètres appliqués.
              </CardDescription>
              <span className="text-xs font-medium text-muted-foreground">
                Période :{" "}
                <span className="text-foreground">
                  {periodLabel.from} → {periodLabel.to}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-md">
                <Label htmlFor="reports-search" className="sr-only">
                  Rechercher un spot
                </Label>
                <Input
                  id="reports-search"
                  placeholder="Rechercher par produit / marque ou titre du spot"
                  value={tableSearch}
                  onChange={(event) => setTableSearch(event.target.value)}
                  className="h-10 rounded-full border-border/60"
                />
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="valorization-operator"
                    className="text-xs font-semibold uppercase text-muted-foreground"
                  >
                    Valorisation
                  </Label>
                  <Select
                    value={valorizationOperator}
                    onValueChange={(value) =>
                      setValorizationOperator(value as typeof valorizationOperator)
                    }
                  >
                    <SelectTrigger
                      id="valorization-operator"
                      className="h-10 w-[160px] rounded-full border-border/60"
                    >
                      <SelectValue placeholder="Filtrer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Toutes les valorisations</SelectItem>
                      <SelectItem value="gt">Supérieure à</SelectItem>
                      <SelectItem value="eq">Égale à</SelectItem>
                      <SelectItem value="lt">Inférieure à</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-36">
                  <Label htmlFor="valorization-amount" className="sr-only">
                    Montant de valorisation
                  </Label>
                  <Input
                    id="valorization-amount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Montant"
                    value={valorizationAmount}
                    onChange={(event) => setValorizationAmount(event.target.value)}
                    className="h-10 rounded-full border-border/60"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetInlineFilters}
                  disabled={inlineFiltersPristine}
                >
                  Effacer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Impossible de charger les rapports</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {loadingData ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-[#0c6e85]" />
                <p className="text-sm font-medium">Chargement des données…</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date &amp; heure</TableHead>
                        <TableHead>Chaîne</TableHead>
                        <TableHead>Annonceur</TableHead>
                        <TableHead>Produit / marque</TableHead>
                        <TableHead>Secteur</TableHead>
                        <TableHead>Type de station</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Valorisation</TableHead>
                        <TableHead>Titre du spot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            Aucun résultat ne correspond aux filtres appliqués.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagination.items.map((row) => {
                          const durationLabel = row.duree_seconds
                            ? formatDurationFromSeconds(row.duree_seconds)
                            : formatDurationFromSeconds(
                                coerceNumber(row.duree_seconds)
                              )
                          const valorizationValue = coerceNumber(
                            row.valorization
                          )
                          return (
                            <TableRow key={`${row.id}-${row.date_debut}`}>
                              <TableCell className="whitespace-nowrap">
                                {formatDateTime(row.date_debut)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.chaine || "—"}
                              </TableCell>
                              <TableCell>{row.annonceur || "—"}</TableCell>
                              <TableCell>{row.marque || "—"}</TableCell>
                              <TableCell>{row.secteur_activite || "—"}</TableCell>
                              <TableCell>{row.station_type || "—"}</TableCell>
                              <TableCell>{durationLabel}</TableCell>
                              <TableCell>
                                {valorizationValue > 0
                                  ? formatCurrency(valorizationValue)
                                  : "—"}
                              </TableCell>
                              <TableCell className="max-w-xs whitespace-normal break-words">
                                {row.titre || "—"}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {filteredData.length === 0
                      ? "Aucune donnée disponible."
                      : `Affichage de ${
                          pagination.start + 1
                        } à ${pagination.end} sur ${filteredData.length} entrées.`}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="page-size"
                        className="text-xs font-semibold uppercase text-muted-foreground"
                      >
                        Résultats / page
                      </Label>
                      <Select
                        value={String(pageSize)}
                        onValueChange={handlePageSizeChange}
                      >
                        <SelectTrigger
                          id="page-size"
                          className="h-9 w-[84px] rounded-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination className="w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              handlePageChange(page - 1)
                            }}
                          />
                        </PaginationItem>
                        {displayedPages.map((item, index) =>
                          item === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={item}>
                              <PaginationLink
                                href="#"
                                isActive={item === page}
                                onClick={(event) => {
                                  event.preventDefault()
                                  handlePageChange(item)
                                }}
                              >
                                {item}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              handlePageChange(page + 1)
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  )
}

interface DatePickerFieldProps {
  id: string
  placeholder: string
  date: Date | undefined
  onChange: (next: Date | undefined) => void
  normalizeDate: (date: Date) => Date
}

function DatePickerField({ id, placeholder, date, onChange, normalizeDate }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() => date ?? new Date())

  useEffect(() => {
    if (date) {
      const normalized = normalizeDate(date)
      setMonth(normalized)
    }
  }, [date, normalizeDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm font-medium text-foreground hover:border-[#0c6e85]/40"
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
              onChange(undefined)
              return
            }
            const normalized = normalizeDate(selected)
            onChange(normalized)
            setMonth(normalized)
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

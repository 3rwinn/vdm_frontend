import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarIcon, FileDown, Loader2, Sparkles } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"

import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspaceDropdown } from "@/hooks/use-workspace-dropdown"
import {
  downloadSimulationReport,
  runSimulation,
  type SimulationChannelAllocation,
  type SimulationRecommendations,
  type SimulationRequest,
} from "@/lib/api"
import { getStoredWorkspace } from "@/lib/workspaces"
import { cn, formatCurrency } from "@/lib/utils"
import { paths } from "@/routes/paths"

interface DatePickerFieldProps {
  id: string
  placeholder: string
  date: Date | undefined
  onChange: (next: Date | undefined) => void
}

function DatePickerField({ id, placeholder, date, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() => date ?? new Date())

  useEffect(() => {
    if (date) {
      setMonth(date)
    }
  }, [date])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm font-medium text-foreground hover:border-[#0c6e85]/40"
        >
          {date ? format(date, "dd/MM/yyyy") : placeholder}
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
            onChange(selected)
            setMonth(selected)
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

type FormState = {
  advertiser: string
  investmentAmount: string
  advertisementDuration: string
  startDate: Date | undefined
  endDate: Date | undefined
}

const PIE_COLORS = ["#0c6e85", "#f26a24", "#7c3aed", "#059669", "#ef4444", "#facc15", "#3b82f6", "#ec4899"]

const BAR_COLORS = ["#f26a24", "#7c3aed", "#059669", "#ef4444", "#facc15", "#3b82f6", "#ec4899", "#14b8a6"]

const baseInvestmentChartConfig = {
  suggested_investment: {
    label: "Budget recommandé (FCFA)",
    color: "#0c6e85",
  },
}

const spotsChartConfig = {
  estimated_spots: {
    label: "Nombre de spots recommandés",
    color: "#f26a24",
  },
}

function formatNumberInput(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("fr-FR")
}

function parseFormattedNumber(value: string): string {
  return value.replace(/\s/g, "").replace(/\u00A0/g, "")
}

export function SimulationPage() {
  const navigate = useNavigate()
  const { tokens, logout } = useAuth()
  const { selectedWorkspace, selectWorkspace, workspaces, loading } = useWorkspaceDropdown({
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

  const productCode = useMemo(() => {
    return selectedWorkspace?.products_details?.[0]?.code
      ? String(selectedWorkspace.products_details[0].code).trim().toLowerCase()
      : null
  }, [selectedWorkspace?.products_details])

  const today = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  }, [])

  const [formState, setFormState] = useState<FormState>({
    advertiser: selectedWorkspace?.id_client ?? "",
    investmentAmount: formatNumberInput("20000000"),
    advertisementDuration: "30",
    startDate: defaultStart,
    endDate: today,
  })

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      advertiser: selectedWorkspace?.id_client ?? prev.advertiser,
    }))
  }, [selectedWorkspace?.id_client])

  useEffect(() => {
    setSimulationResult(null)
    setSimulationError(null)
  }, [selectedWorkspace?.id])

  const [loadingSimulation, setLoadingSimulation] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationRecommendations | null>(null)
  const [simulationError, setSimulationError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [lastRequest, setLastRequest] = useState<SimulationRequest | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const handleInputChange = useCallback(
    (field: keyof FormState, value: string | Date | undefined) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }))
    },
    []
  )

  const formatISODate = useCallback((date: Date | undefined) => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSimulationError(null)

      if (!tokens?.access) {
        toast.error("Veuillez vous reconnecter pour lancer une simulation.")
        logout()
        return
      }

      if (productCode !== "mep") {
        toast.error("La simulation est disponible uniquement pour les workspaces MEP.")
        return
      }

      const errors: Record<string, string> = {}

      if (!formState.advertiser.trim()) {
        errors.advertiser = "Annonceur requis."
      }

      const investmentAmount = Number(parseFormattedNumber(formState.investmentAmount))
      if (!Number.isFinite(investmentAmount) || investmentAmount <= 0) {
        errors.investmentAmount = "Montant d’investissement invalide."
      }

      const advertisementDuration = Number(formState.advertisementDuration)
      if (!Number.isFinite(advertisementDuration) || advertisementDuration <= 0) {
        errors.advertisementDuration = "Durée de spot invalide."
      }

      if (!formState.startDate) {
        errors.startDate = "Date de début requise."
      }

      if (!formState.endDate) {
        errors.endDate = "Date de fin requise."
      }

      if (formState.startDate && formState.endDate && formState.startDate > formState.endDate) {
        errors.endDate = "La date de fin doit être postérieure au début."
      }

      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) {
        return
      }

      setLoadingSimulation(true)

      const payload: SimulationRequest = {
        advertiser: formState.advertiser.trim(),
        investmentAmount,
        advertisementDuration,
        dateFrom: formatISODate(formState.startDate),
        dateTo: formatISODate(formState.endDate),
      }

      try {
        const response = await runSimulation(payload, tokens.access)

        if (!response.success || !response.recommendations) {
          throw new Error("Simulation indisponible pour le moment.")
        }

        setSimulationResult(response.recommendations)
        setLastRequest(payload)
        toast.success("Simulation réalisée avec succès.")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de lancer la simulation."
        setSimulationError(message)
        toast.error(message)
        setSimulationResult(null)
      } finally {
        setLoadingSimulation(false)
      }
    },
    [formState, formatISODate, logout, productCode, tokens?.access]
  )

  const handleExportPdf = useCallback(async () => {
    if (!simulationResult || !lastRequest) return
    if (!tokens?.access) {
      toast.error("Veuillez vous reconnecter pour exporter le rapport.")
      logout()
      return
    }
    setExportingPdf(true)
    try {
      const blob = await downloadSimulationReport(lastRequest, tokens.access)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const safeName = lastRequest.advertiser.replace(/[^a-z0-9._ -]/gi, "_").trim() || "annonceur"
      link.download = `simulation_${safeName}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success("Rapport PDF généré.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de générer le rapport PDF."
      toast.error(message)
    } finally {
      setExportingPdf(false)
    }
  }, [simulationResult, lastRequest, tokens?.access, logout])

  const channelEntries = useMemo(() => {
    if (!simulationResult?.channel_allocation) {
      return []
    }
    return Object.entries(simulationResult.channel_allocation).map(([channel, details]) => ({
      channel,
      ...details,
    }))
  }, [simulationResult?.channel_allocation])

  const investmentChartData = useMemo(
    () =>
      channelEntries.map((entry) => ({
        channel: entry.channel,
        suggested_investment: entry.suggested_investment,
      })),
    [channelEntries]
  )

  const investmentChartConfig = useMemo(() => {
    const dynamicConfig: Record<string, { label: string; color: string }> = {}
    investmentChartData.forEach((entry, index) => {
      dynamicConfig[entry.channel] = {
        label: entry.channel,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }
    })

    return {
      ...baseInvestmentChartConfig,
      ...dynamicConfig,
    }
  }, [investmentChartData])

  const spotsChartData = useMemo(
    () =>
      channelEntries.map((entry) => ({
        channel: entry.channel,
        estimated_spots: entry.estimated_spots,
      })),
    [channelEntries]
  )

  const impactVariant = useCallback((impact: string) => {
    const normalized = impact.toLowerCase()
    if (normalized === "high") return "success" as const
    if (normalized === "medium") return "warning" as const
    if (normalized === "low") return "secondary" as const
    return "outline" as const
  }, [])

  const workspaceLabel = selectedWorkspace?.name ?? "Aucun workspace sélectionné"

  if (selectedWorkspace && productCode !== "mep") {
    return (
      <DashboardShell>
        <section className="mt-10">
          <Card className="flex flex-col items-center justify-center gap-4 rounded-3xl border-none bg-white p-12 text-center shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
              <Sparkles className="h-7 w-7 text-[#0c6e85]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Simulation indisponible</h2>
              <p className="text-sm text-muted-foreground">
                Le module de simulation est accessible uniquement pour les workspaces MEP. Sélectionnez un workspace compatible pour explorer les recommandations d’investissement.
              </p>
            </div>
          </Card>
        </section>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#0c6e85]">Simulation</p>
          <h1 className="text-3xl font-semibold text-foreground">Planifier une campagne média</h1>
          <p className="text-sm text-muted-foreground">
            Workspace : <span className="font-semibold text-foreground">{workspaceLabel}</span>
          </p>
        </div>
        <div className="flex w-full items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:border-[#0c6e85]/40"
              >
                <span className="text-muted-foreground">Espace courant :</span>
                <span className="max-w-[220px] truncate font-semibold text-foreground">{workspaceLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              <DropdownMenuLabel>Vos espaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
              ) : workspaces.length === 0 ? (
                <DropdownMenuItem disabled>Aucun workspace disponible</DropdownMenuItem>
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
                        isActive && "bg-[#0c6e85]/10 text-[#0c6e85] focus:bg-[#0c6e85]/10"
                      )}
                    >
                      <span className="text-sm font-semibold">{workspace.name}</span>
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
        </div>
      </header>

      <section className="mt-10 flex flex-col gap-8">
        {/* <Card className="border-none bg-white shadow-lg xl:w-[360px] xl:shrink-0"> */}
        <Card className="border-none bg-white shadow-lg ">
          <CardHeader>
            <CardTitle>Paramètres de simulation</CardTitle>
            <CardDescription>
              Définissez l’annonceur, le budget et la période pour obtenir une recommandation personnalisée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="investmentAmount">Budget disponible (FCFA)</Label>
                  <Input
                    id="investmentAmount"
                    type="text"
                    inputMode="numeric"
                    value={formState.investmentAmount}
                    onChange={(event) => {
                      handleInputChange("investmentAmount", formatNumberInput(event.target.value))
                      setFieldErrors((prev) => { const { investmentAmount: _, ...rest } = prev; return rest })
                    }}
                    className={fieldErrors.investmentAmount ? "border-destructive" : ""}
                  />
                  {fieldErrors.investmentAmount && (
                    <p className="text-xs font-medium text-destructive">{fieldErrors.investmentAmount}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="advertisementDuration">Durée d’un spot (secondes)</Label>
                  <Select
                    value={formState.advertisementDuration}
                    onValueChange={(value) => handleInputChange("advertisementDuration", value)}
                  >
                    <SelectTrigger id="advertisementDuration">
                      <SelectValue placeholder="Durée moyenne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 secondes</SelectItem>
                      <SelectItem value="20">20 secondes</SelectItem>
                      <SelectItem value="30">30 secondes</SelectItem>
                      <SelectItem value="45">45 secondes</SelectItem>
                      <SelectItem value="60">60 secondes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Période - début</Label>
                  <DatePickerField
                    id="period-start"
                    placeholder="JJ/MM/AAAA"
                    date={formState.startDate}
                    onChange={(date) => {
                      handleInputChange("startDate", date)
                      setFieldErrors((prev) => { const { startDate: _, ...rest } = prev; return rest })
                    }}
                  />
                  {fieldErrors.startDate && (
                    <p className="text-xs font-medium text-destructive">{fieldErrors.startDate}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Période - fin</Label>
                  <DatePickerField
                    id="period-end"
                    placeholder="JJ/MM/AAAA"
                    date={formState.endDate}
                    onChange={(date) => {
                      handleInputChange("endDate", date)
                      setFieldErrors((prev) => { const { endDate: _, ...rest } = prev; return rest })
                    }}
                  />
                  {fieldErrors.endDate && (
                    <p className="text-xs font-medium text-destructive">{fieldErrors.endDate}</p>
                  )}
                </div>
              </div>

              {simulationError ? (
                <Alert variant="destructive">
                  <AlertTitle>Simulation échouée</AlertTitle>
                  <AlertDescription>{simulationError}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-[#0c6e85] text-white hover:bg-[#0a5a6c]"
                disabled={loadingSimulation}
              >
                {loadingSimulation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calcul en cours…
                  </>
                ) : (
                  "Lancer la simulation"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8 xl:col-span-1">
          {!simulationResult ? (
            <Card className="border-none bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Résultats à venir</CardTitle>
                <CardDescription>
                  Lancez une simulation pour obtenir la meilleure combinaison de chaînes, créneaux horaires et budget.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c6e85]/10">
                  <BarChart3 className="h-7 w-7 text-[#0c6e85]" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Configurez vos paramètres, puis cliquez sur « Lancer la simulation » pour découvrir vos recommandations personnalisées.
                </p>
              </CardContent>
            </Card>
          ) : (
        <div className="flex-1 space-y-8">
              <Card className="border-none bg-white shadow-lg">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>Résumé de la recommandation</CardTitle>
                      <CardDescription>
                        Allocation optimale du budget de {formatCurrency(simulationResult.total_budget)} pour {simulationResult.campaign_period.total_days} jours.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={simulationResult.is_new_advertiser ? "warning" : "success"}>
                        {simulationResult.is_new_advertiser ? "Nouveau annonceur" : "Annonceur connu"}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={exportingPdf || !lastRequest}
                        className="gap-2 border-[#0c6e85]/30 text-[#0c6e85] hover:bg-[#0c6e85]/10"
                      >
                        {exportingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        Exporter en PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryTile label="Secteur analysé" value={simulationResult.sector ?? "—"} />
                  <SummaryTile
                    label="Budget total"
                    value={formatCurrency(simulationResult.total_budget)}
                    accent
                  />
                  <SummaryTile
                    label="Durée spot"
                    value={`${simulationResult.duration.toLocaleString("fr-FR") } s`}
                  />
                  <SummaryTile
                    label="Période"
                    value={`${format(new Date(simulationResult.campaign_period.start), "dd/MM/yyyy")} → ${format(new Date(simulationResult.campaign_period.end), "dd/MM/yyyy")}`}
                  />
                </CardContent>
              </Card>

              {channelEntries.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-none bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>Répartition budgétaire par chaîne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={investmentChartConfig} className="h-[320px] w-full !aspect-auto">
                        <PieChart>
                          <Pie
                            data={investmentChartData}
                            dataKey="suggested_investment"
                            nameKey="channel"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={4}
                          >
                            {investmentChartData.map((entry, index) => (
                              <Cell
                                key={entry.channel}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                stroke="#ffffff"
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>Nombre de spots recommandés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={spotsChartConfig} className="h-[320px] w-full !aspect-auto">
                        <BarChart data={spotsChartData}>
                          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e6e8f0" />
                          <XAxis dataKey="channel" tickLine={false} axisLine={false} tickMargin={12} />
                          <YAxis tickLine={false} axisLine={false} />
                          <ChartTooltip cursor={{ fill: "rgba(242,106,36,0.08)" }} content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="estimated_spots" radius={6}>
                            {spotsChartData.map((entry, index) => (
                              <Cell
                                key={`${entry.channel}-spots`}
                                fill={BAR_COLORS[index % BAR_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              <Card className="border-none bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>Détails par chaîne</CardTitle>
                  <CardDescription>
                    Budget, spots estimés et créneaux horaires recommandés pour chaque support.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chaîne</TableHead>
                          <TableHead>Impact</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Spots estimés</TableHead>
                          <TableHead>Coût moyen</TableHead>
                          <TableHead>Part actuelle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {channelEntries.map((entry) => (
                          <TableRow key={entry.channel}>
                            <TableCell className="font-semibold">{entry.channel}</TableCell>
                            <TableCell>
                              <Badge variant={impactVariant(entry.impact_level)}>{entry.impact_level}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(entry.suggested_investment)}</TableCell>
                            <TableCell>{entry.estimated_spots.toLocaleString("fr-FR")}</TableCell>
                            <TableCell>{formatCurrency(entry.avg_cost_per_spot)}</TableCell>
                            <TableCell>{entry.current_share}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {channelEntries.map((entry) => (
                      <TimeSlotCard key={`${entry.channel}-timeslots`} channel={entry.channel} slots={entry.optimal_time_slots} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 shadow-sm",
        accent && "border-[#0c6e85]/50 bg-[#0c6e85]/10"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function TimeSlotCard({ channel, slots }: { channel: string; slots: Array<string | number> }) {
  const formattedSlots = slots
    .map((slot) => {
      if (typeof slot === "number") {
        return `${slot}h`
      }
      if (typeof slot === "string") {
        return `${slot.replace(/h?$/i, "")}h`
      }
      return null
    })
    .filter((slot): slot is string => Boolean(slot))

  return (
    <Card className="border border-border/60 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{channel}</CardTitle>
          <Badge variant="outline" className="border-[#0c6e85]/30 text-[#0c6e85]">
            Créneaux clés
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Trois créneaux où la valorisation est la plus forte pour cette chaîne.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formattedSlots.length > 0 ? (
          <div className="rounded-xl border border-dashed border-[#0c6e85]/30 bg-[#0c6e85]/5 p-4">
            <ul className="grid gap-2 text-sm font-medium text-[#0c6e85]">
              {formattedSlots.map((slot) => (
                <li key={slot} className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#0c6e85]" />
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucun créneau identifié pour cette chaîne.</p>
        )}
      </CardContent>
    </Card>
  )
}

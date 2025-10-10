import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Pie,
  PieChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, Sparkles } from "lucide-react";

import {
  calculateDifference,
  cn,
  convertDailyMetricsToChartData,
  convertSectorDailyMetricsToChartData,
  convertTimeSlotMetricsToChartData,
  replaceColonBySlashandConvert,
  replaceSlashByLabel,
} from "@/lib/utils";

import moment from "moment";

interface MetvDashboardProps {
  ddaData: any;
  channelIdentifier: string;
  sectorIdentifier: string;
}

export function MetvDashboard({
  ddaData,
  channelIdentifier,
  sectorIdentifier,
}: MetvDashboardProps) {
  const timeSlotData = useMemo(() => {
    const converted = convertTimeSlotMetricsToChartData(
      ddaData?.data?.metrics?.time_slot_metrics
    );
    if (converted && converted.length > 0) {
      return converted;
    }
    return [];
  }, [ddaData?.data?.metrics?.time_slot_metrics]);

  const dailyMetricData = useMemo(() => {
    const converted = convertDailyMetricsToChartData(
      ddaData?.data?.metrics?.daily_metrics
    );

    if (converted && converted.length > 0) {
      return converted;
    }

    return [];
  }, [ddaData?.data?.metrics?.daily_metrics]);

  return (
    <>
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <StatCard
          title="Nombre de spot total"
          metric={ddaData?.data?.nvd?.sector?.nombre_spots_total || 0}
          metaLabel="Récent"
          gradient
          recent={[
            {
              label: "Nombre total de spot",
              channel: channelIdentifier,
              value:
                ddaData?.data?.nvd?.sector_and_channel?.nombre_spots_total || 0,
            },
            {
              label: "Nombre total de spot",
              channel: "CONCURRENCE",
              value:
                ddaData?.data?.nvd?.sector?.nombre_spots_total -
                  ddaData?.data?.nvd?.sector_and_channel?.nombre_spots_total ||
                0,
            },
          ]}
        />
        <StatCard
          title="Valorisation totale"
          metric={`${ddaData?.data?.nvd?.sector?.total_valorisation || 0} FCFA`}
          metaLabel="Récent"
          gradient
          recent={[
            {
              label: "Valorisation totale",
              channel: channelIdentifier,
              value:
                ddaData?.data?.nvd?.sector_and_channel?.total_valorisation || 0,
            },
            {
              label: "Valorisation totale",
              channel: "CONCURRENCE",
              value:
                ddaData?.data?.nvd?.sector?.total_valorisation -
                  ddaData?.data?.nvd?.sector_and_channel?.total_valorisation ||
                0,
            },
          ]}
        />
        <StatCard
          title="Durée commerciale totale"
          metric={replaceSlashByLabel(
            ddaData?.data?.nvd?.sector?.duree_commercial_total || 0
          )}
          metaLabel="Récent"
          gradient
          recent={[
            {
              label: "Durée totale",
              channel: channelIdentifier,
              value:
                replaceSlashByLabel(
                  ddaData?.data?.nvd?.sector_and_channel?.duree_commercial_total
                ) || 0,
            },
            {
              label: "Durée commerciale totale",
              channel: "CONCURRENCE",
              value:
                calculateDifference(
                  ddaData?.data?.nvd?.sector?.duree_commercial_total,
                  ddaData?.data?.nvd?.sector_and_channel?.duree_commercial_total
                ) || 0,
            },
          ]}
        />
      </section>

      <section className="mt-6">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Nombre de spots / j
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ChartContainer
              config={{
                spots: {
                  label: "Nombre de spots",
                  color: "#0c6e85",
                },
              }}
              className="h-68 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyMetricData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="jour"
                    tickLine={true}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => moment(value).format("DD/MM/YY")}
                  />
                  <YAxis dataKey="spots" tickLine={false} axisLine={false} />

                  <ChartTooltip
                    cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                    labelFormatter={(value) => `Plage horaire : ${value}`}
                  />
                  <Area dataKey="spots" fill="#0c6e85" type="linear" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Heure de passage des spots
              </p>
            </div>
          </div>
          <div className="mt-8">
            <ChartContainer
              config={{
                spots: {
                  label: "Nombre de spots",
                  color: "#0c6e85",
                },
              }}
              className="h-68 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeSlotData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="heure"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                    labelFormatter={(value) => `Plage horaire : ${value}`}
                  />
                  <Area dataKey="spots" fill="#0c6e85" type="step" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Heure de passage des spots
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Comparaison des valorisations
              </p>
            </div>
          </div>
          <div className="mt-6 ">
            <ChartContainer
              config={{
                spots: {
                  label: "Nombre de spots",
                  color: "#0c6e85",
                },
              }}
              className="h-68 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                {/* Remplacer timeSlot par les vrais données de valorisation */}
                <BarChart data={timeSlotData} layout="vertical">
                  <CartesianGrid vertical={false} />
                  <XAxis
                    type="number"
                    dataKey={"spots"}
                    // hide
                  />
                  <YAxis
                    type="category"
                    dataKey="heure"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                    labelFormatter={(value) => `Plage horaire : ${value}`}
                  />
                  <Bar dataKey="spots" fill="#0c6e85" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>
      </section>

      <SectorAnalysisSection
        datas={ddaData?.data}
        sector={sectorIdentifier}
        chaine={channelIdentifier}
      />
    </>
  );
}

interface StatCardProps {
  title: string;
  metric: string;
  metaLabel: string;
  gradient?: boolean;
  recent: Array<{ channel: string; value: string | number; label?: string }>;
}

function StatCard({
  title,
  metric,
  metaLabel,
  gradient,
  recent,
}: StatCardProps) {
  return (
    <Card className="rounded-3xl border-none bg-white shadow-lg">
      <CardContent className="space-y-6 p-6">
        <div
          className={
            gradient
              ? "rounded-2xl bg-gradient-to-br from-[#0d7f93] via-[#0a617a] to-[#09455f] p-5 text-white"
              : "rounded-2xl bg-muted/40 p-5"
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">
                {title}
              </p>
              <p className="mt-2 text-3xl font-semibold">{metric}</p>
            </div>
            <Sparkles className="h-5 w-5 opacity-80" />
          </div>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            {metaLabel}
          </p>
          <div className="space-y-3">
            {recent.map((item) => (
              <div
                key={`${item.channel}-${item.value}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
                    <CalendarClock className="h-5 w-5 text-[#0c6e85]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.channel}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {item.label ?? "Aujourd'hui, 16h36"}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectorAnalysisSection({ datas, sector, chaine }) {
  const [activeTab, setActiveTab] = useState<
    "spots" | "valorisations" | "duree"
  >("spots");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const rankingEntries = useMemo(() => {
    const source =
      activeTab === "spots"
        ? datas?.classement_sectors?.by_spots
        : activeTab === "valorisations"
        ? datas?.classement_sectors?.by_valorisation
        : datas?.classement_sectors?.by_duration;
    return Array.isArray(source) ? source : [];
  }, [activeTab, datas?.sector_stats]);

  const totalPages =
    rankingEntries.length > 0
      ? Math.ceil(rankingEntries.length / ITEMS_PER_PAGE)
      : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sector]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedEntries = useMemo(() => {
    if (rankingEntries.length === 0) {
      return [];
    }
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rankingEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [rankingEntries, currentPage]);

  const paginationRange = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 0, totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, 0, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 0, currentPage - 1, currentPage, currentPage + 1, 0, totalPages];
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const sectorDailyMetrics = convertSectorDailyMetricsToChartData(
    datas?.sector_metrics
  );

  console.log("sectorDaily", sectorDailyMetrics);

  const spotOnSectors = datas?.nvd?.sector?.nombre_spots_total;
  const spotOnSectorChannel =
    datas?.nvd?.sector_and_channel?.nombre_spots_total;

  const percentageSpotOnSectorChannel =
    Math.round((spotOnSectorChannel * 100) / spotOnSectors) || 0;

  const valorisationOnSectors = datas?.nvd?.sector?.total_valorisation;
  const valorisationOnSectorChannel =
    datas?.nvd?.sector_and_channel?.total_valorisation;

  const percentageValorisationOnSectorChannel =
    (valorisationOnSectorChannel * 100) / valorisationOnSectors || 0;

  return (
    <section className="mt-10 space-y-6">
      <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Analyse sectorielle
            </h2>
            <p className="text-sm text-muted-foreground">
              Visualisez la performance journalière de vos secteurs clés.
            </p>
          </div>
          {/* <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Secteur
            </span>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-56 rounded-full border border-border/70 bg-muted/30 text-sm font-medium text-foreground">
                <SelectValue placeholder="Choisir un secteur" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {sectorOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
        </div>

        <div className="mt-8 grid gap-6">
          {/* <div className="rounded-3xl bg-gradient-to-r from-[#0d7f93]/10 via-white to-white p-6 shadow-sm"> */}
          <div className="rounded-3xl">
            <div>
              <div>
                <ChartContainer
                  config={{
                    spots: { label: "Spots", color: "#0c6e85" },
                    valorisation: { label: "Valorisation", color: "#f26a24" },
                  }}
                  className="h-68 rounded-2xl bg-white p-4"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorDailyMetrics}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#dbe4f3"
                      />
                      <XAxis
                        dataKey="jour"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          moment(value).format("DD/MM/YY")
                        }
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <ChartTooltip
                        cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                      />
                      <Bar
                        dataKey="spots"
                        radius={[6, 6, 0, 0]}
                        fill="#0c6e85"
                      />
                      <Bar
                        dataKey="valorisation"
                        radius={[6, 6, 0, 0]}
                        fill="#f26a24"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="rounded-3xl border-none bg-white p-6 shadow-lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Taux d'occupation
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  Vue sectorielle
                </h3>
              </div>
              {/* <span className="inline-flex items-center gap-2 rounded-full bg-[#0c6e85]/10 px-3 py-1 text-xs font-semibold text-[#0c6e85]">
                Taux spots secteur <span className="text-foreground">10%</span>
              </span> */}
            </div>
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)]">
              <div className="mx-auto flex h-60 w-full max-w-xs items-center justify-center md:h-64">
                <ChartContainer
                  config={{
                    sector: { label: "Nombre spots secteur", color: "#0c6e85" },
                    rti: { label: "Nombre spots RTI", color: "#f26a24" },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip />
                      <Pie
                        data={[
                          {
                            name: "Nombre spots secteur",
                            value: spotOnSectors,
                            fill: "#0c6e85",
                          },
                          {
                            name: "Nombre spots",
                            value: spotOnSectorChannel,
                            fill: "#f26a24",
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#0c6e85]">
                      <span className="h-2 w-2 rounded-full bg-[#0c6e85]" />{" "}
                      Nombre de spots sur le secteur {sector}
                    </span>
                    <span className="font-semibold text-foreground">
                      {spotOnSectors}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#f26a24]">
                      <span className="h-2 w-2 rounded-full bg-[#f26a24]" />{" "}
                      Nombre de spots de {chaine} sur le secteur {sector}
                    </span>
                    <span className="font-semibold text-foreground">
                      {spotOnSectorChannel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-black font-bold">
                      <span className="h-2 w-2 rounded-full bg-black" /> Taux
                      d'occupation par spot de {chaine}
                    </span>
                    <span className="font-semibold text-foreground">
                      {percentageSpotOnSectorChannel} %
                    </span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#0c6e85]">
                      <span className="h-2 w-2 rounded-full bg-[#0c6e85]" />{" "}
                      Valorisation du secteur {sector}
                    </span>
                    <span className="font-semibold text-foreground">
                      {valorisationOnSectors} F CFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#f26a24]">
                      <span className="h-2 w-2 rounded-full bg-[#f26a24]" />{" "}
                      Valorisation de {chaine} sur le secteur {sector}
                    </span>
                    <span className="font-semibold text-foreground">
                      {valorisationOnSectorChannel} F CFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-black font-bold">
                      <span className="h-2 w-2 rounded-full bg-black" /> Taux
                      d'occupation par valorisation de {chaine}
                    </span>
                    <span className="font-semibold text-foreground">
                      {percentageValorisationOnSectorChannel} %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-none bg-white p-0 shadow-lg">
          {/* <div className="rounded-t-3xl bg-gradient-to-r from-[#f8f1ea] via-[#f2f5f9] to-[#f8f1ea] p-6"> */}
          <div className="rounded-t-3xl bg-gradient-to-br from-[#0d7f93] via-[#0a617a] to-[#09455f] p-6">
            <div className="flex items-center justify-between">
              <div>
                {/* <p className="text-xs uppercase tracking-wide text-muted-foreground/70"> */}
                <p className="text-xs uppercase tracking-wide text-white">
                  Classement des secteurs sur
                </p>
                <h3 className="text-lg font-semibold text-[#f26a24]">
                  {chaine}
                </h3>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/60 p-1 text-xs font-semibold text-muted-foreground">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 transition ${
                    activeTab === "spots"
                      ? "bg-white text-[#0c6e85] shadow"
                      : "hover:bg-white/80"
                  }`}
                  onClick={() => setActiveTab("spots")}
                >
                  Spots
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 transition ${
                    activeTab === "valorisations"
                      ? "bg-white text-[#0c6e85] shadow"
                      : "hover:bg-white/80"
                  }`}
                  onClick={() => setActiveTab("valorisations")}
                >
                  Valorisations
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 transition ${
                    activeTab === "duree"
                      ? "bg-white text-[#0c6e85] shadow"
                      : "hover:bg-white/80"
                  }`}
                  onClick={() => setActiveTab("duree")}
                >
                  Durée des spots
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-6 text-sm">
            {paginatedEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                Aucune donnée disponible pour ce classement.
              </div>
            ) : (
              paginatedEntries.map((item: any, index: number) => {
                const rank = startIndex + index + 1;
                return (
                  <div
                    key={`${item.sector}-${rank}`}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm transition hover:border-[#0c6e85]/40"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                        {item.sector}
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {activeTab === "duree" &&
                          replaceColonBySlashandConvert(item.value)}
                        {activeTab === "valorisations" && `${item.value} FCFA`}
                        {activeTab === "spots" && item.value}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fbe8dd] px-3 py-1 text-xs font-semibold text-[#f26a24]">
                      {rank}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {totalPages > 1 ? (
            <Pagination className="justify-end pb-6 pl-6 pr-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage((page) => Math.max(page - 1, 1));
                      }
                    }}
                    aria-disabled={currentPage === 1}
                    className={cn(
                      "h-9 w-9",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {paginationRange.map((page, index) => (
                  <PaginationItem key={`page-${index}-${page}`}>
                    {page === 0 ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages)
                        );
                      }
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={cn(
                      "h-9 w-9",
                      currentPage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </Card>
      </div>
    </section>
  );
}

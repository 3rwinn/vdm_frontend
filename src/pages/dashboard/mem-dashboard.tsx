import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { cn, formatCurrency, replaceColonBySlashandConvert } from "@/lib/utils";

import type { MemAnalysisResponse } from "@/lib/api";

const channelChartConfig = {
  nb_spots: { label: "Nombre de spots", color: "#0c6e85", suffix: " spots" },
  valorisation: {
    label: "Valorisation (FCFA)",
    color: "#f26a24",
    suffix: " FCFA",
  },
  duree_minutes: {
    label: "Durée (minutes)",
    color: "#7c3aed",
    suffix: " minutes",
  },
} as const;

const weeklyChartConfig = {
  nb_spots: { label: "Nombre de spots", color: "#0c6e85", suffix: " spots" },
  valorisation: {
    label: "Valorisation (FCFA)",
    color: "#f26a24",
    suffix: " FCFA",
  },
} as const;

const monthlyChartConfig = {
  nb_spots: { label: "Nombre de spots", color: "#0c6e85", suffix: " spots" },
  valorisation: {
    label: "Valorisation (FCFA)",
    color: "#f26a24",
    suffix: " FCFA",
  },
} as const;

interface MemDashboardProps {
  data: MemAnalysisResponse | null;
}

function parseNumeric(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDurationToSeconds(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }
  const parts = value.split(":").map((part) => Number(part));
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  if (parts.length === 1) {
    return Number(parts[0]) || 0;
  }
  return 0;
}

function formatDurationLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length || secs) parts.push(`${secs}s`);
  return parts.join(" ");
}

function normalizeHourLabel(label: string) {
  return label.replace("H", "h");
}

function normalizeDuration(value: string) {
  if (!value) {
    return "—";
  }
  if (value.includes(":")) {
    return replaceColonBySlashandConvert(value).replace(/s$/, "");
  }
  return value;
}

export function MemDashboard({ data }: MemDashboardProps) {
  const [activeAnnouncerTab, setActiveAnnouncerTab] = useState<
    "spots" | "valorisation" | "duree"
  >("spots");
  const [activeSectorTab, setActiveSectorTab] = useState<
    "spots" | "valorisation" | "duree"
  >("spots");

  const analysis = data;

  const hourlyChartData = useMemo(() => {
    if (!analysis?.hourly_data) return [];
    return Object.entries(analysis.hourly_data).map(([slot, metrics]) => {
      return {
        slot,
        label: normalizeHourLabel(slot),
        nb_spots: metrics.nb_spots,
      };
    });
  }, [analysis?.hourly_data]);

  const weeklyChartData = useMemo(() => {
    const weeklyEntries = analysis?.weekly_data
      ? Object.entries(analysis.weekly_data)
      : [];
    return weeklyEntries.map(([day, metrics]) => ({
      day,
      label: day.charAt(0).toUpperCase() + day.slice(1),
      nb_spots: metrics.nb_spots,
      valorisation: parseNumeric(metrics.valorisation),
    }));
  }, [analysis?.weekly_data]);

  const monthlyChartData = useMemo(() => {
    const monthlyEntries = analysis?.monthly_data ?? [];
    return monthlyEntries.map((entry) => ({
      month: entry.mois,
      label: entry.mois,
      nb_spots: entry.nb_spots,
      valorisation: parseNumeric(entry.valorisation),
    }));
  }, [analysis?.monthly_data]);

  const hourlyLegendConfig = useMemo(
    () => ({
      nb_spots: { label: "Nombre de spots", color: "#0c6e85" },
    }),
    []
  );

  const [activeWeeklyMetric, setActiveWeeklyMetric] = useState<
    keyof typeof weeklyChartConfig
  >("nb_spots");
  const [activeMonthlyMetric, setActiveMonthlyMetric] = useState<
    keyof typeof monthlyChartConfig
  >("nb_spots");

  const channelBarData = useMemo(() => {
    const chainEntries = analysis?.chains ?? [];
    return chainEntries.slice(0, 12).map((entry) => ({
      chaine: entry.chaine,
      nb_spots: entry.nb_spots,
      valorisation: parseNumeric(entry.valorisation),
      duree_minutes: Math.round(
        parseDurationToSeconds(entry.duree_commerciale) / 60
      ),
    }));
  }, [analysis?.chains]);
  const [activeChannelMetric, setActiveChannelMetric] = useState<
    keyof typeof channelChartConfig
  >("nb_spots");

  const spotSummaryDetails = useMemo(() => {
    const chains = analysis?.chains ?? [];
    return chains
      .map((entry) => ({
        label: entry.chaine,
        sortValue: entry.nb_spots,
        value: entry.nb_spots.toLocaleString("fr-FR"),
      }))
      .sort((a, b) => b.sortValue - a.sortValue)
      .map(({ label, value }) => ({ label, value }));
  }, [analysis?.chains]);

  const valorisationSummaryDetails = useMemo(() => {
    const chains = analysis?.chains ?? [];
    return chains
      .map((entry) => {
        const valorisationNumeric = parseNumeric(entry.valorisation);
        return {
          label: entry.chaine,
          sortValue: valorisationNumeric,
          value: formatCurrency(valorisationNumeric),
        };
      })
      .sort((a, b) => b.sortValue - a.sortValue)
      .map(({ label, value }) => ({ label, value }));
  }, [analysis?.chains]);

  const durationSummaryDetails = useMemo(() => {
    const chains = analysis?.chains ?? [];
    return chains
      .map((entry) => {
        const seconds = parseDurationToSeconds(entry.duree_commerciale);
        return {
          label: entry.chaine,
          sortValue: seconds,
          value: normalizeDuration(entry.duree_commerciale),
        };
      })
      .sort((a, b) => b.sortValue - a.sortValue)
      .map(({ label, value }) => ({ label, value }));
  }, [analysis?.chains]);

  if (!analysis) {
    return (
      <section className="mt-10 flex flex-1 items-center justify-center">
        <Card className="w-full max-w-2xl border-dashed border-muted bg-muted/20 p-10 text-center shadow-none">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucune donnée MEM disponible pour ce workspace.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const {
    global,
    classement_annonceurs,
    classement_secteurs,
  } = analysis;

  const activeAnnouncerRanking =
    activeAnnouncerTab === "spots"
      ? classement_annonceurs.top_spots
      : activeAnnouncerTab === "valorisation"
        ? classement_annonceurs.top_valorisation
        : classement_annonceurs.top_duree;

  const activeSectorRanking =
    activeSectorTab === "spots"
      ? classement_secteurs.top_spots
      : activeSectorTab === "valorisation"
        ? classement_secteurs.top_valorisation
        : classement_secteurs.top_duree;

  return (
    <div className="mt-10 space-y-10">
      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Nombre total de spots"
          value={global.nb_spots.toLocaleString("fr-FR")}
          accent="spots"
          details={spotSummaryDetails}
        />
        <SummaryCard
          title="Valorisation totale"
          value={global.valorisation}
          accent="valorisation"
          details={valorisationSummaryDetails}
        />
        <SummaryCard
          title="Durée commerciale"
          value={normalizeDuration(global.duree_commerciale)}
          accent="duration"
          details={durationSummaryDetails}
        />
      </section>

      {/* <section className="grid gap-6 lg:grid-cols-[2fr_3fr]"> */}
      <section className="grid gap-6 lg:grid-col">
        <InteractiveBarCard
          title="Performance par chaîne"
          description="Comparaison des principaux indicateurs"
          data={channelBarData}
          categoryKey="chaine"
          chartConfig={channelChartConfig}
          activeMetric={activeChannelMetric}
          onMetricChange={setActiveChannelMetric}
          sortByValue
        />

        <Card className="rounded-3xl border-none bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Répartition horaire des spots</CardTitle>
            <p className="text-xs text-muted-foreground">
              Nombre de spots diffusés par plage horaire
            </p>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ChartContainer
              config={hourlyLegendConfig}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyChartData} layout="vertical">
                  <CartesianGrid horizontal stroke="#e8eef5" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={70}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        formatter={(value) => (
                          <span className="text-xs text-muted-foreground">
                            {Number(value ?? 0).toLocaleString("fr-FR")} spots
                          </span>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="nb_spots"
                    fill="#0c6e85"
                    radius={[0, 6, 6, 0]}
                  />
                  <Bar
                    dataKey="duration_minutes"
                    fill="#f26a24"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <InteractiveBarCard
          title="Performance hebdomadaire"
          description="Spots et valorisation cumulés par jour"
          data={weeklyChartData}
          categoryKey="label"
          chartConfig={weeklyChartConfig}
          activeMetric={activeWeeklyMetric}
          onMetricChange={setActiveWeeklyMetric}
        />

        {/* <InteractiveBarCard
          title="Performance mensuelle"
          description="Spots et valorisation cumulés par mois"
          data={monthlyChartData}
          categoryKey="label"
          chartConfig={monthlyChartConfig}
          activeMetric={activeMonthlyMetric}
          onMetricChange={setActiveMonthlyMetric}
        /> */}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingCard
          title="Classement des annonceurs"
          tabs={[
            { id: "spots", label: "Spots" },
            { id: "valorisation", label: "Valorisation" },
            { id: "duree", label: "Durée" },
          ]}
          activeTab={activeAnnouncerTab}
          onTabChange={setActiveAnnouncerTab}
          entries={activeAnnouncerRanking}
          itemKey="annonceur"
        />
        <RankingCard
          title="Classement des secteurs"
          tabs={[
            { id: "spots", label: "Spots" },
            { id: "valorisation", label: "Valorisation" },
            { id: "duree", label: "Durée" },
          ]}
          activeTab={activeSectorTab}
          onTabChange={setActiveSectorTab}
          entries={activeSectorRanking}
          itemKey="secteur"
        />
      </section>
    </div>
  );
}

interface SummaryCardDetail {
  label: string;
  value: string;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  accent: "spots" | "valorisation" | "duration";
  details?: SummaryCardDetail[];
}

function SummaryCard({ title, value, accent, details }: SummaryCardProps) {
  const accentClasses =
    accent === "spots"
      ? "from-[#0d7f93] via-[#0a617a] to-[#09455f]"
      : accent === "valorisation"
        ? "from-[#f26a24] via-[#d8560a] to-[#c14705]"
        : "from-[#7c3aed] via-[#5b21b6] to-[#4c1d95]";

  const detailBadgeClass =
    accent === "spots"
      ? "bg-[#0c6e85]/10 text-[#0c6e85]"
      : accent === "valorisation"
        ? "bg-[#f26a24]/10 text-[#d35400]"
        : "bg-[#7c3aed]/10 text-[#5b21b6]";

  return (
    <Card className="rounded-3xl border-none bg-white shadow-lg">
      <CardContent className="space-y-4 p-6">
        <div
          className={cn(
            "rounded-2xl p-5 text-white shadow-inner",
            `bg-gradient-to-br ${accentClasses}`
          )}
        >
          <p className="text-xs uppercase tracking-wide opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-semibold">
            {typeof value === "number"
              ? value.toLocaleString("fr-FR")
              : value}
          </p>
        </div>
        {details && details.length ? (
          <div className="space-y-2 pr-1">
            {details.map((detail) => (
              <div
                key={`${title}-${detail.label}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium text-muted-foreground">
                  {detail.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 font-semibold",
                    detailBadgeClass
                  )}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface RankingCardProps {
  title: string;
  tabs: Array<{ id: "spots" | "valorisation" | "duree"; label: string }>;
  activeTab: "spots" | "valorisation" | "duree";
  onTabChange: (tab: "spots" | "valorisation" | "duree") => void;
  entries: Array<Record<string, string | number>>;
  itemKey: string;
}

function RankingCard({
  title,
  tabs,
  activeTab,
  onTabChange,
  entries,
  itemKey,
}: RankingCardProps) {
  const formatDetailValue = (entryValue: string | number) => {
    if (activeTab === "valorisation") {
      const numeric = parseNumeric(entryValue);
      return formatCurrency(numeric);
    }
    if (activeTab === "duree") {
      if (typeof entryValue === "string") {
        return normalizeDuration(entryValue);
      }
      return formatDurationLabel(Number(entryValue));
    }
    if (typeof entryValue === "number") {
      return entryValue.toLocaleString("fr-FR");
    }
    return String(entryValue);
  };

  return (
    <Card className="rounded-3xl border-none bg-white shadow-lg pt-0">
      <CardHeader className="flex flex-col gap-4 rounded-t-3xl bg-gradient-to-br from-[#0d7f93] via-[#0a617a] to-[#09455f] p-6 text-white">
        <div className="flex items-center justify-between w-full ">
          <CardTitle className="text-lg font-semibold text-white">
            {title}
          </CardTitle>
          <div className="inline-flex items-center gap-1 rounded-full bg-muted/80 p-1 text-xs font-semibold text-muted-foreground">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "rounded-full px-3 py-1 transition",
                  activeTab === tab.id
                    ? "bg-white text-[#0c6e85] shadow"
                    : "hover:bg-white/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs uppercase tracking-wide text-white">
          Top 20
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
            Aucune donnée disponible.
          </div>
        ) : (
          entries.map((entry, index) => {
            const label = String(entry[itemKey] ?? "—");
            const rawValue = entry.value ?? 0;
            const formattedValue = formatDetailValue(rawValue);

            return (
              <div
                key={`${itemKey}-${label}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm transition hover:border-[#0c6e85]/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c6e85]/10 text-xs font-semibold text-[#0c6e85]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formattedValue}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

interface InteractiveBarCardProps<TMetric extends string> {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  chartConfig: Record<TMetric, { label: string; color: string; suffix?: string }>;
  activeMetric: TMetric;
  onMetricChange: (metric: TMetric) => void;
  sortByValue?: boolean;
}

function InteractiveBarCard<TMetric extends string>({
  title,
  description,
  data,
  categoryKey,
  chartConfig,
  activeMetric,
  onMetricChange,
  sortByValue = false,
}: InteractiveBarCardProps<TMetric>) {
  const metricKeys = Object.keys(chartConfig) as TMetric[];

  const preparedData = useMemo(() => {
    const dataset = data.map((entry) => ({
      ...entry,
      [categoryKey]: entry[categoryKey],
    }));
    if (!sortByValue) {
      return dataset;
    }
    return [...dataset].sort((a, b) => {
      const valueA = Number(a[activeMetric] ?? 0);
      const valueB = Number(b[activeMetric] ?? 0);
      return valueB - valueA;
    });
  }, [data, categoryKey, activeMetric, sortByValue]);

  const totalValue = useMemo(() => {
    return preparedData.reduce(
      (acc, entry) => acc + Number(entry[activeMetric] ?? 0),
      0
    );
  }, [preparedData, activeMetric]);

  const suffix = chartConfig[activeMetric].suffix ?? "";

  return (
    <Card className="rounded-3xl border-none bg-white shadow-lg">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 w-full">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {title}
            </CardTitle>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-muted/80 p-1 text-xs font-semibold text-muted-foreground">
            {metricKeys.map((metric) => (
              <button
                key={metric}
                type="button"
                onClick={() => onMetricChange(metric)}
                className={cn(
                  "rounded-full px-3 py-1 transition",
                  activeMetric === metric
                    ? "bg-white text-[#0c6e85] shadow"
                    : "hover:bg-white/80"
                )}
              >
                {chartConfig[metric].label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
          Total&nbsp;
          <span className="font-semibold text-foreground">
            {totalValue.toLocaleString("fr-FR")}
            {suffix}
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig as Record<string, { label: string; color?: string }>}
          className="h-[340px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={preparedData}
              // layout="vertical"
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid horizontal stroke="#e8eef5" />
              {/* <XAxis type="number" tick={{ fontSize: 11 }} /> */}
              <XAxis type="category" dataKey={categoryKey} tick={{ fontSize: 11 }} />
              <YAxis
                
                // type="category"
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={120}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">
                        {Number(value ?? 0).toLocaleString("fr-FR")}
                        {suffix}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey={activeMetric}
                fill={chartConfig[activeMetric].color}
                // radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

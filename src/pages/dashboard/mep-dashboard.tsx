import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn, formatCurrency, replaceColonBySlashandConvert } from "@/lib/utils";
import { type MepAnalysisResponse, type MepValueEntry } from "@/lib/api";

import { LightStatCard } from "@/components/common/stat-card";

interface MepDashboardProps {
  data: MepAnalysisResponse | null;
  annonceurIdentifier: string;
  sectorIdentifier: string;
}

function parseAmount(value: string | number) {
  if (typeof value === "number") {
    return value;
  }
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatValorisation(value: string | number) {
  return formatCurrency(parseAmount(value));
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

function prepareRankingEntries(entries: MepValueEntry[], limit = 10) {
  return entries.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

function normalizeSlotLabel(label: string) {
  return label
    .replace("H", "h")
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function durationStringToSeconds(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const sanitized = value.trim();
  if (!sanitized) {
    return 0;
  }
  const segments = sanitized.split(":").map((part) => Number(part));
  if (segments.some((part) => Number.isNaN(part))) {
    return 0;
  }
  if (segments.length === 3) {
    const [hours, minutes, seconds] = segments;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (segments.length === 2) {
    const [minutes, seconds] = segments;
    return minutes * 60 + seconds;
  }
  if (segments.length === 1) {
    return segments[0];
  }
  return 0;
}

function formatDurationLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const parts: string[] = [];

  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes) {
    parts.push(`${minutes}m`);
  }
  if (!parts.length || remainingSeconds) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(" ");
}

export function MepDashboard({
  data,
  annonceurIdentifier,
  sectorIdentifier,
}: MepDashboardProps) {
  const analysis = data?.mep_analysis;

  const totalValorisation =
    Number(analysis?.annonceur?.valorisation?.replaceAll(" ", "")) +
    Number(analysis?.concurrence?.valorisation?.replaceAll(" ", ""));
  const percentageValorisation = Math.round(
    (Number(analysis?.annonceur?.valorisation?.replaceAll(" ", "")) * 100) /
      totalValorisation
  );

  const totalSpots =
    analysis?.annonceur.nb_spots + analysis?.concurrence.nb_spots;
  const percentageSpots = Math.round(
    (analysis?.annonceur?.nb_spots - analysis?.concurrence?.nb_spots * 100) /
      totalSpots
  );
  const topSpots = useMemo(() => {
    return prepareRankingEntries(
      analysis?.classement_produit.global.top_20_spots ?? []
    );
  }, [analysis?.classement_produit.global.top_20_spots]);

  const topValorisation = useMemo(() => {
    return prepareRankingEntries(
      analysis?.classement_produit.global.top_20_valorisation ?? []
    );
  }, [analysis?.classement_produit.global.top_20_valorisation]);

  const topDurations = useMemo(() => {
    return prepareRankingEntries(
      analysis?.classement_produit.global.top_20_duration ?? []
    ).map((entry) => ({
      ...entry,
      formattedDuration: normalizeDuration(String(entry.value)),
    }));
  }, [analysis?.classement_produit.global.top_20_duration]);

  const [rankingTab, setRankingTab] = useState<
    "spots" | "valorisation" | "duree"
  >("spots");

  const rankingEntries = useMemo(() => {
    if (rankingTab === "valorisation") {
      return topValorisation;
    }
    if (rankingTab === "duree") {
      return topDurations;
    }
    return topSpots;
  }, [rankingTab, topSpots, topValorisation, topDurations]);

  const rankingValueLabel = useMemo(() => {
    switch (rankingTab) {
      case "valorisation":
        return "Valorisation";
      case "duree":
        return "Durée cumulée";
      default:
        return "Nombre de spots";
    }
  }, [rankingTab]);

  const formatRankingValue = (
    entry: (typeof rankingEntries)[number]
  ): string => {
    if (rankingTab === "valorisation") {
      return formatValorisation(entry.value);
    }
    if (rankingTab === "duree") {
      return (
        entry.formattedDuration ??
        normalizeDuration(String(entry.value ?? "00:00:00"))
      );
    }
    const numericValue = parseAmount(entry.value);
    return Number.isFinite(numericValue)
      ? numericValue.toLocaleString("fr-FR")
      : String(entry.value);
  };

  const hourlyData = useMemo(() => {
    if (!analysis?.hourly_data) {
      return [];
    }
    return Object.entries(analysis.hourly_data).map(([slot, metrics]) => ({
      slot,
      label: slot,
      annonceurSpots: metrics.annonceur.nb_spots,
      globalSpots: metrics.global.nb_spots,
      annonceurValorisation: parseAmount(metrics.annonceur.valorisation),
      globalValorisation: parseAmount(metrics.global.valorisation),
    }));
  }, [analysis?.hourly_data]);

  const dailyData = useMemo(() => {
    if (!analysis?.days_data) {
      return [];
    }
    return Object.entries(analysis.days_data).map(([day, metrics]) => ({
      day,
      label: day.charAt(0).toUpperCase() + day.slice(1),
      annonceurSpots: metrics.annonceur.nb_spots,
      globalSpots: metrics.global.nb_spots,
      annonceurValorisation: parseAmount(metrics.annonceur.valorisation),
      globalValorisation: parseAmount(metrics.global.valorisation),
    }));
  }, [analysis?.days_data]);

  const channelsData = useMemo(() => {
    if (!analysis?.channels_breakdown?.length) {
      return [];
    }
    const palette = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];

    return analysis.channels_breakdown
      .map((entry, index) => {
        const valorisationValue = parseAmount(entry.valorisation);
        const durationSeconds = durationStringToSeconds(
          entry.duree_commerciale
        );
        const color = palette[index % palette.length];

        return {
          chaine: entry.chaine,
          value: valorisationValue,
          spots: entry.nb_spots,
          duration: entry.duree_commerciale,
          durationSeconds,
          durationLabel: formatDurationLabel(durationSeconds),
          color,
        };
      })
      .filter(
        (entry) =>
          entry.value > 0 || entry.spots > 0 || entry.durationSeconds > 0
      );
  }, [analysis?.channels_breakdown]);

  const channelsLegendConfig = useMemo(() => {
    return channelsData.reduce<Record<string, { label: string }>>(
      (acc, entry) => {
        acc[entry.chaine] = {
          label: entry.chaine,
        };
        return acc;
      },
      {}
    );
  }, [channelsData]);

  const durationTickFormatter = (seconds: number) =>
    formatDurationLabel(
      Number.isFinite(seconds) ? seconds : Number(seconds) || 0
    );

  const hourlyLegendConfig = useMemo(
    () => ({
      annonceurSpots: {
        label: annonceurIdentifier || "Annonceur",
        color: "#0c6e85",
      },
      globalSpots: {
        label: "Concurrence",
        color: "#f26a24",
      },
    }),
    [annonceurIdentifier]
  );

  const weeklyLegendConfig = useMemo(
    () => {
      const label = annonceurIdentifier || "Annonceur";
      return {
        annonceur: { label, color: "#0c6e85" },
        global: { label: "Concurrence", color: "#f26a24" },
        annonceurSpots: { label, color: "#0c6e85" },
        globalSpots: { label: "Concurrence", color: "#f26a24" },
      };
    },
    [annonceurIdentifier]
  );

  if (!analysis) {
    return (
      <section className="mt-10 flex flex-1 items-center justify-center">
        <Card className="w-full max-w-2xl border-dashed border-muted bg-muted/20 text-center shadow-none">
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground">
              Aucune donnée MEP disponible pour la période sélectionnée.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      <section className="grid gap-6 lg:grid-cols-2">
        <LightStatCard
          title="Durée commerciale"
          metric={normalizeDuration(analysis.annonceur.duree_commerciale)}
          gradient
          trendValue={percentageSpots}
          trendDescription={`par rapport à la concurrence, soit ${analysis.annonceur.nb_spots.toLocaleString("fr-FR")} contre ${analysis.concurrence.nb_spots.toLocaleString("fr-FR")} spots.`}
        />

        <LightStatCard
          title="Valorisation totale"
          metric={formatValorisation(analysis.annonceur.valorisation)}
          trendValue={percentageValorisation}
          trendDescription="par rapport à la concurrence."
          gradient
        />

        {/* <LightStatCard 
          //title="Durée commerciale totale"
          //metric={normalizeDuration(analysis.annonceur.duree_commerciale)}
          //metaLabel="Récent"
          //gradient
          // recent={[ 
          //   {
          //     label: "Durée totale",
          //     channel: annonceurIdentifier,
          //     value: normalizeDuration(analysis.annonceur.duree_commerciale),
          //   },
          //   {
          //     label: "Durée commerciale totale",
          //     channel: "CONCURRENCE",
          //     value: normalizeDuration(analysis.concurrence.duree_commerciale),
          //   },
          // ]}
        />
        */}
      </section>

      {channelsData.length > 0 ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl border-none bg-white shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Répartition par chaîne</CardTitle>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Valorisation et nombre de spots
              </p>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ChartContainer
                config={channelsLegendConfig}
                className="mx-auto h-full max-h-[280px] w-full aspect-square"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(
                          value,
                          _name,
                          _item,
                          _index,
                          payloadEntry
                        ) => {
                          const payload = payloadEntry as
                            | (typeof channelsData)[number]
                            | undefined;
                          if (!payload) {
                            return null;
                          }
                          const color = payload.color;
                          const numericValue =
                            typeof value === "number"
                              ? value
                              : Number.parseFloat(String(value ?? 0));
                          return (
                            <div className="flex flex-col gap-1 text-left">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-semibold text-foreground">
                                  {payload.chaine}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatValorisation(numericValue)} ·{" "}
                                {payload.spots.toLocaleString("fr-FR")} spots
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  
                  <Pie
                    data={channelsData}
                    dataKey="value"
                    nameKey="chaine"
                    innerRadius={70}
                    outerRadius={110}
                    strokeWidth={2}
                    paddingAngle={2}
                  >
                    {channelsData.map((entry) => (
                      <Cell key={entry.chaine} fill={entry.color} />
                    ))}
                    
                  </Pie>
                  <ChartLegend
                      content={<ChartLegendContent />}
                      className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center text-['#000'] mt-4"
                    />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-white shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Répartition par chaîne</CardTitle>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                Durée commerciale
              </p>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelsData}>
                    <CartesianGrid vertical={false} stroke="#e8eef5" />
                    <XAxis
                      dataKey="chaine"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={durationTickFormatter}
                    />
                    <ChartTooltip
                      cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          indicator="line"
                          formatter={(
                            value,
                            _name,
                            _item,
                            _index,
                            payloadEntry
                          ) => {
                            const payload = payloadEntry as
                              | (typeof channelsData)[number]
                              | undefined;
                            if (!payload) {
                              return null;
                            }
                            return (
                              <div className="flex flex-col gap-1 text-left">
                                <span className="text-xs font-semibold text-foreground">
                                  {payload.chaine}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {payload.durationLabel} ·{" "}
                                  {payload.spots.toLocaleString("fr-FR")} spots
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Bar dataKey="durationSeconds" radius={[6, 6, 0, 0]}>
                      {channelsData.map((entry) => (
                        <Cell key={entry.chaine} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* <section className="grid gap-6 lg:grid-cols-[3fr_2fr]"> */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-none bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Répartition horaire des spots</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ChartContainer
              config={hourlyLegendConfig}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} layout="vertical">
                  <CartesianGrid horizontal stroke="#e8eef5" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(12, 110, 133, 0.08)" }}
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        labelFormatter={(label) => (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {normalizeSlotLabel(String(label ?? ""))}
                            </span>
                          </div>
                        )}
                        formatter={(value, name, item) => {
                          if (item == null) {
                            return null;
                          }
                          const color =
                            item.color || item.payload?.fill || "#0c6e85";
                          const friendlyName =
                            name && String(name).includes("global")
                              ? "Concurrence"
                              : annonceurIdentifier || "Annonceur";
                          const numericValue =
                            typeof value === "number"
                              ? value
                              : Number(value ?? 0);

                          return (
                            <div className="flex items-center justify-between gap-6 text-xs">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="font-medium text-foreground">
                                  {friendlyName}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                {numericValue.toLocaleString("fr-FR")} spots
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} className="text-['#000']"/>
                  <Bar
                    dataKey="annonceurSpots"
                    fill="#0c6e85"
                    radius={[0, 6, 6, 0]}
                  />
                  <Bar
                    dataKey="globalSpots"
                    fill="#f26a24"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Performance hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ChartContainer
              config={weeklyLegendConfig}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid vertical={false} stroke="#e8eef5" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "rgba(12, 110, 133, 0.25)" }}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => {
                          return (
                            <div className="flex flex-col gap-1 text-left">
                              <span className="text-xs font-semibold text-foreground">
                                {normalizeSlotLabel(name ?? "")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(typeof value === "number"
                                  ? value
                                  : Number(value ?? 0)
                                ).toLocaleString("fr-FR")}{" "}
                                spots
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <defs>
                    <linearGradient id="area-annonceur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-annonceur)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-annonceur)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="area-global" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-global)" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="var(--color-global)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="annonceurSpots"
                    stroke="var(--color-annonceur)"
                    fill="url(#area-annonceur)"
                    fillOpacity={1}
                    strokeWidth={2}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="globalSpots"
                    stroke="var(--color-global)"
                    fill="url(#area-global)"
                    fillOpacity={1}
                    strokeWidth={2}
                    activeDot={{ r: 5 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      {/* <Card className="rounded-3xl border-none bg-white shadow-lg"> */}
      <Card className="rounded-3xl border-none bg-white shadow-lg p-0">
        <div className="rounded-t-3xl bg-gradient-to-br from-[#0d7f93] via-[#0a617a] to-[#09455f] p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">
                Classement prioritaire
              </p>
              <h3 className="text-lg font-semibold text-[#f26a24]">
                Top 20 marques / produits
              </h3>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/70 p-1 text-xs font-semibold text-muted-foreground">
              <button
                type="button"
                onClick={() => setRankingTab("spots")}
                className={`rounded-full px-3 py-1 transition ${
                  rankingTab === "spots"
                    ? "bg-white text-[#0c6e85] shadow"
                    : "hover:bg-white/80"
                }`}
              >
                Spots
              </button>
              <button
                type="button"
                onClick={() => setRankingTab("valorisation")}
                className={`rounded-full px-3 py-1 transition ${
                  rankingTab === "valorisation"
                    ? "bg-white text-[#0c6e85] shadow"
                    : "hover:bg-white/80"
                }`}
              >
                Valorisation
              </button>
              <button
                type="button"
                onClick={() => setRankingTab("duree")}
                className={`rounded-full px-3 py-1 transition ${
                  rankingTab === "duree"
                    ? "bg-white text-[#0c6e85] shadow"
                    : "hover:bg-white/80"
                }`}
              >
                Durée
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {rankingEntries.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs text-muted-foreground">
              Aucune donnée disponible pour ce classement.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground/70">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Marque</th>
                  <th className="px-6 py-3 text-right">{rankingValueLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rankingEntries.map((entry) => {
                  const isActive =
                    annonceurIdentifier &&
                    entry.marque?.toLowerCase() ===
                      annonceurIdentifier.toLowerCase();
                  const rowClass = cn(
                    "transition",
                    isActive
                      ? "bg-[#fef3ea] hover:bg-[#fde4d2]"
                      : "hover:bg-muted/30"
                  );
                  return (
                    <tr
                      key={`${rankingTab}-${entry.rank}-${entry.marque}`}
                      className={rowClass}
                    >
                      <td className="px-6 py-3 text-sm font-semibold text-[#f26a24]">
                        {entry.rank}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {entry.marque}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                        {formatRankingValue(entry)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

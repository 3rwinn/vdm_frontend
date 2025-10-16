import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, CalendarClock, Sparkles } from "lucide-react";

interface StatCardProps {
  title: string;
  metric: string;
  metaLabel: string;
  trendValue?: number;
  trendDescription?: string;
  gradient?: boolean;
  recent: Array<{ channel: string; value: string | number; label?: string }>;
}

export function LightStatCard({
  title,
  metric,
  metaLabel,
  trendValue,
  trendDescription,
  gradient,
}: StatCardProps) {
  const hasTrendInfo =
    typeof trendValue === "number" && Number.isFinite(trendValue) && Boolean(trendDescription);
  const isPositive = Number(trendValue) >= 0;
  const formattedTrend =
    typeof trendValue === "number"
      ? `${trendValue > 0 ? "+" : trendValue < 0 ? "-" : ""}${Math.abs(trendValue)}%`
      : null;

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
          {hasTrendInfo ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-4 w-4" aria-hidden />
                )}
                <span>{formattedTrend}</span>
              </span>
              <span className="text-sm text-muted-foreground/80">
                {trendDescription}
              </span>
            </div>
          ) : (
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
              {metaLabel}
            </p>
          )}
          {/*<div className="space-y-3">
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
          </div>*/}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatCard({
  title,
  metric,
  metaLabel,
  trendValue,
  trendDescription,
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

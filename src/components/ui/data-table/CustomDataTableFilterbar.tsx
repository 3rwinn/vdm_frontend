"use client"

import { Button } from "@/components/Button"
import { Searchbar } from "@/components/Searchbar"
import { conditions, regions, statuses } from "@/data/data"
import { formatters } from "@/lib/utils"
import { RiDownloadLine } from "@remixicon/react"
import { Table } from "@tanstack/react-table"
import { useState } from "react"
import { useDebouncedCallback } from "use-debounce"
import { DataTableFilter } from "./DataTableFilter"
import { ViewOptions } from "./DataTableViewOptions"
import { fr } from "date-fns/locale"
import { DateRange, DateRangePicker } from "@/components/DatePicker"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  exportFn: () => void
  dateRange?: DateRange | undefined
  setDateRange?: () => any
}

export function CustomFilterbar<TData>({
  table,
  exportFn,
  dateRange,
  setDateRange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [searchTerm, setSearchTerm] = useState<string>("")

  const presets = [
    { label: "Aujourd'hui", dateRange: { from: new Date(), to: new Date() } },
    {
      label: "7 derniers jours",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: "30 derniers jours",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
    {
      label: "3 derniers mois",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        to: new Date(),
      },
    },
    {
      label: "6 derniers mois",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        to: new Date(),
      },
    },
    {
      label: "Mois en cours",
      dateRange: { from: new Date(new Date().setDate(1)), to: new Date() },
    },
    {
      label: "Année en cours",
      dateRange: {
        from: new Date(new Date().setFullYear(new Date().getFullYear(), 0, 1)),
        to: new Date(),
      },
    },
    {
      label: "Mois précédent",
      dateRange: {
        from: new Date(
          new Date().setFullYear(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ),
        ),
        to: new Date(
          new Date().setFullYear(
            new Date().getFullYear(),
            new Date().getMonth(),
            0,
          ),
        ),
      },
    },
    {
      label: "Semaine précédente",
      dateRange: {
        from: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay() - 6),
        ),
        to: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay()),
        ),
      },
    },
    {
      label: "30 prochains jours",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 29)),
      },
    },
    {
      label: "Cette semaine",
      dateRange: {
        from: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay()),
        ),
        to: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay() + 6),
        ),
      },
    },
    {
      label: "7 Prochains jours",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 6)),
      },
    },
  ]

  const debouncedSetFilterValue = useDebouncedCallback((value) => {
    table.getColumn("annonceur")?.setFilterValue(value)
  }, 300)

  const handleSearchChange = (event: any) => {
    const valueInput = event.target.value
    const value = valueInput.toUpperCase()
    setSearchTerm(value)
    debouncedSetFilterValue(value)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-x-6">
      <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center">
        {/* {table.getColumn("secteur_activite")?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn("secteur_activite")}
            title="Secteur d'activité"
            options={statuses}
            type="select"
          />
        )} */}
        {/* {table.getColumn("annonceur")?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn("annonceur")}
            title="Annonceur"
            options={regions}
            type="checkbox"
          />
        )}  */}

        <DateRangePicker
          placeholder="Choisissez une date"
          translations={{
            cancel: "Annuler",
            apply: "Appliquer",
            range: "Intervalle de dates",
          }}
          locale={fr}
          presets={presets}
          value={dateRange}
          onChange={setDateRange}
          className="w-60"
        />

        {table.getColumn("annonceur")?.getIsVisible() && (
          <Searchbar
            type="search"
            placeholder="Rechercher par annonceur..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:max-w-[250px] sm:[&>input]:h-[30px]"
          />
        )}
        {table.getColumn("valorization")?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn("valorization")}
            title="Valorisation"
            type="number"
            options={conditions}
            formatter={formatters.currency}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="border border-gray-200 px-2 font-semibold text-indigo-600 sm:border-none sm:py-1 dark:border-gray-800 dark:text-indigo-500"
          >
            Supprimer les filtres
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
          onClick={exportFn}
        >
          <RiDownloadLine className="size-4 shrink-0" aria-hidden="true" />
          Générer rapport de pige
        </Button>
        <ViewOptions table={table} />
      </div>
    </div>
  )
}

"use client"

import { Badge, BadgeProps } from "@/components/Badge"
import { Checkbox } from "@/components/Checkbox"
import { statuses } from "@/data/data"
import { Usage } from "@/data/schema"
import { dateFormatter, formatters } from "@/lib/utils"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"
import { ConditionFilter } from "@/components/ui/data-table/DataTableFilter"
import { DataTableRowActions } from "@/components/ui/data-table/DataTableRowActions"

const columnHelper = createColumnHelper<Usage>()

export const DatasByChaineColumns = [
  //   columnHelper.display({
  //     id: "select",
  //     header: ({ table }) => (
  //       <Checkbox
  //         checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomeRowsSelected() ? "indeterminate" : false}
  //         onCheckedChange={() => table.toggleAllPageRowsSelected()}
  //         className="translate-y-0.5"
  //         aria-label="Select all"
  //       />
  //     ),
  //   }),
  columnHelper.accessor("secteur_activite", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Secteur d'activité" />
    ),
    enableHiding: true,
    enableSorting: false,
    meta: {
      className: "text-left",
      displayName: "Secteur d'activité",
    },
    
  }),
  columnHelper.accessor("annonceur", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Annonceur" />
    ), 
    enableSorting: false,
    meta: {
      className: "text-left",
      displayName: "Annonceur",
    },
    filterFn: "arrIncludes",
  }),
  columnHelper.accessor("titre", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Titre" />
    ),
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "text-left",
      displayName: "Titre",
    },
  }),
  columnHelper.accessor("date", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    enableSorting: false,
    meta: {
      className: "tabular-nums",
      displayName: "Date",
    },
    cell: ({ row }) => {
      return <span>{dateFormatter(row.getValue("date"))}</span>
    },
  }),
  columnHelper.accessor("valorization", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valorisation" />
    ),
    enableSorting: true,
    meta: {
      className: "text-left",
      displayName: "Valorisation",
    },
    cell: ({ getValue }) => {
      return <span>{formatters.unit(getValue())} FCFA</span>
    },
    filterFn: (row, columnId, filterValue: ConditionFilter) => {
      const value = row.getValue(columnId) as number
      const [min, max] = filterValue.value as [number, number]

      switch (filterValue.condition) {
        case "is-equal-to":
          return value == min
        case "is-between":
          return value >= min && value <= max
        case "is-greater-than":
          return value > min
        case "is-less-than":
          return value < min
        default:
          return true
      }
    },
  }),
] as ColumnDef<Usage>[]


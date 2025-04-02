"use client"
import React, { useEffect, useState } from "react"
import { cx } from "@/lib/utils"
import { Card } from "../Card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../Table"
// import { RiBarChartFill } from "@remixicon/react"
import EmptyDatas from "./EmptyDatas"
import { DonutChart } from "../DonutChart"

const data = [
  {
    name: "Travel",
    amount: 6730,
    share: "32.1%",
    color: "bg-cyan-500 dark:bg-cyan-500",
  },
  {
    name: "IT & equipment",
    amount: 4120,
    share: "19.6%",
    color: "bg-blue-500 dark:bg-blue-500",
  },
  {
    name: "Training & development",
    amount: 3920,
    share: "18.6%",
    color: "bg-indigo-500 dark:bg-indigo-500",
  },
  {
    name: "Office supplies",
    amount: 3210,
    share: "15.3%",
    color: "bg-violet-500 dark:bg-violet-500",
  },
  {
    name: "Communication",
    amount: 3010,
    share: "14.3%",
    color: "bg-fuchsia-500 dark:bg-fuchsia",
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

const currencyFormatter = (number: number) =>
   Intl.NumberFormat("fr").format(number).toString()
  // "$" + Intl.NumberFormat("us").format(number).toString()

const dataColors = ["cyan", "blue", "indigo", "violet", "amber", "red", "yellow", "lime", "fuchsia", "orange"]

function TopAnnonceur({ datas }: { datas: any }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {datas?.map((item, indexOne) => (
        <Card key={indexOne} className="sm:mx-auto sm:max-w-lg">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50">
           Top annonceur par {item.categorie}
          </h3>
          <DonutChart
            className="mx-auto mt-8"
            data={item.datas}
            category="annonceur"
            value="pourcentage"
            showLabel={false}
            // valueFormatter={currencyFormatter}
            showTooltip={true}
            colors={dataColors as any}
          />
          <p className="mt-8 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>Annonceur</span> <span>Valeur / %</span>
          </p>
          <ul
            role="list"
            className="mt-2 divide-y divide-gray-200 text-sm text-gray-500 dark:divide-gray-800 dark:text-gray-500"
          >
            {item?.datas?.map((item, indexTwo) => (
              <li
                key={indexTwo}
                className="relative flex items-center justify-between py-2"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={cx(`bg-${dataColors[indexTwo]}-500`, "size-2.5 shrink-0 rounded-sm")}
                    aria-hidden={true}
                  />
                  <span className="truncate dark:text-gray-300">
                    {item.annonceur}
                  </span>
                </div>
                <p className="flex items-center space-x-2">
                  <span className="font-medium tabular-nums text-gray-900 dark:text-gray-50">
                    {/* {currencyFormatter(item.value)} */}
                    {indexOne === 2 ? currencyFormatter(item.value) : item.value}
                    {/* {item.value} */}
                  </span>
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {item.pourcentage}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}

function Example({ datas }) {
  return (
    <div className="mt-10">
      <Card>
        <div className="text-tremor-content-mdediu dark:text-dark-tremor-content-strong mb-4 text-lg font-medium">
          Repartition de la durée commerciale
        </div>

        {!datas || datas.length === 0 ? (
          <EmptyDatas
            title="Aucune donnée disponible"
            description="Il n'y a pas de données à afficher pour le moment."
          />
        ) : (
          <Table className="mt-0">
            <TableHead>
              <TableRow className="border-tremor-border dark:border-dark-tremor-border border-b">
                <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Chaine
                </TableHeaderCell>
                <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
                  Durée commerciale
                </TableHeaderCell>
                <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
                  Durée commerciale concurrence
                </TableHeaderCell>
                <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
                  Nombre de spot
                </TableHeaderCell>
                <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
                  Nombre de spot concurrence
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datas?.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">
                    <div className="flex space-x-3">
                      <span
                        className={classNames(
                          // item.bgColor,
                          "bg-blue-500",
                          "w-1 shrink-0 rounded",
                        )}
                        aria-hidden={true}
                      />
                      <span>{item.chaine}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.duration}</TableCell>
                  <TableCell className="text-right">
                    {item.duration_concurrence}
                  </TableCell>
                  <TableCell className="text-right">{item.spots}</TableCell>
                  <TableCell className="text-right">
                    {item.spots_concurrence}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function MepDashboard({ datas }: { datas: any }) {
  const [duree_commerciale, setDureeCommerciale] = useState<string>("00:00:00")
  const [valorisation, setValorisation] = useState<string>("0")

  useEffect(() => {
    if (datas?.first) {
      setDureeCommerciale(datas?.first?.total_duration)
      setValorisation(datas?.first?.total_valorization)
    } else {
      setDureeCommerciale("00:00:00")
      setValorisation("0")
    }
  }, [datas])

  return (
    <>
      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card key="1">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-4 w-1 rounded-full bg-blue-500`} />
                <dt className="text-gray-500">Durée commerciale</dt>
              </div>
            </div>
            <dd className="text-3xl font-semibold text-gray-900">
              {duree_commerciale}
            </dd>
          </div>
        </Card>
        <Card key="2">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-4 w-1 rounded-full bg-green-500`} />
                <dt className="text-gray-500">Valorisation</dt>
              </div>
            </div>
            <dd className="text-3xl font-semibold text-gray-900">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XOF",
              }).format(valorisation)}
            </dd>
          </div>
        </Card>
        {/* ))} */}
      </dl>
      <Example datas={datas?.first?.stats} />
      <TopAnnonceur datas={datas?.top} />
    </>
  )
}

export default MepDashboard

"use client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/Dropdown"
import { useProducts } from "@/hooks/useProducts"
import { useWorkspaceContext } from "@/context/WsContext"
import { cx, focusInput } from "@/lib/utils"
import { RiArrowRightSLine, RiExpandUpDownLine } from "@remixicon/react"
import React from "react"

export const WorkspaceVdmDesktop = ({ data }) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [hasOpenDialog, setHasOpenDialog] = React.useState(false)
  const dropdownTriggerRef = React.useRef<null | HTMLButtonElement>(null)
  const focusRef = React.useRef<null | HTMLButtonElement>(null)
  const { products } = useProducts()

  const { setActiveProduct } = useWorkspaceContext()

  const workspaceProductIds = data?.products
  const filteredProducts = products?.filter((product) =>
    workspaceProductIds?.includes(product.id),
  ) || []

  function formatProductForDropdown(products) {
    const formattedProducts = products.map((product, index) => {
      const nameMatch = product.name.match(/^(.*?)\s*\((.*?)\)/)
      const mainName = nameMatch ? nameMatch[1].trim() : product.name
      const parenthesesText = nameMatch ? nameMatch[2].trim() : ""

      return {
        value: product.id,
        name: mainName,
        initials: index + 1,
        role: parenthesesText,
        color: "bg-indigo-600 dark:bg-indigo-500",
      }
    })
    return formattedProducts
  }

  if (!data) return null

  return (
    <>
      {/* sidebar (lg+) */}
      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <button
            className={cx(
              "flex w-full items-center gap-x-2.5 rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 hover:dark:bg-gray-900",
              focusInput,
            )}
          >
            <span
              className="flex aspect-square size-8 items-center justify-center rounded bg-indigo-600 p-2 text-xs font-medium text-white dark:bg-indigo-500"
              aria-hidden="true"
            >
              {data?.name ? data.name.slice(0, 2).toUpperCase() : ""}
            </span>
            <div className="flex w-full items-center justify-between gap-x-4 truncate">
              <div className="truncate">
                <p className="truncate whitespace-nowrap text-left text-sm font-medium text-gray-900 dark:text-gray-50">
                  {data?.name}
                </p>
                <p className="whitespace-nowrap text-left text-xs text-gray-700 dark:text-gray-300">
                  Changer de produit ici
                </p>
              </div>
              <RiExpandUpDownLine
                className="size-5 shrink-0 text-gray-500"
                aria-hidden="true"
              />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          hidden={hasOpenDialog}
          onCloseAutoFocus={(event) => {
            if (focusRef.current) {
              focusRef.current.focus()
              focusRef.current = null
              event.preventDefault()
            }
          }}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              Produits ({filteredProducts.length})
            </DropdownMenuLabel>
            {formatProductForDropdown(filteredProducts).map((workspace) => (
              <DropdownMenuItem onClick={() => setActiveProduct(filteredProducts.find((product) => product.id === workspace.value))} key={workspace.value}>
                <div className="flex w-full items-center gap-x-2.5">
                  <span
                    className={cx(
                      workspace.color,
                      "flex aspect-square size-8 items-center justify-center rounded p-2 text-xs font-medium text-white",
                    )}
                    aria-hidden="true"
                  >
                    {workspace.initials}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                      {workspace.name}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-400">
                      {workspace.role}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export const WorkspaceVdmMobile = ({ data }) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const { products } = useProducts()

  const workspaceProductIds = data?.products
  const filteredProducts = products?.filter((product) =>
    workspaceProductIds?.includes(product.id),
  ) || []

  function formatProductForDropdown(products) {
    const formattedProducts = products.map((product, index) => {
      const nameMatch = product.name.match(/^(.*?)\s*\((.*?)\)/)
      const mainName = nameMatch ? nameMatch[1].trim() : product.name
      const parenthesesText = nameMatch ? nameMatch[2].trim() : ""

      return {
        value: product.id,
        name: mainName,
        initials: index + 1,
        role: parenthesesText,
        color: "bg-indigo-600 dark:bg-indigo-500",
      }
    })
    return formattedProducts
  }

  if (!data) return null

  return (
    <>
      {/* sidebar (xs-lg) */}
      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-x-1.5 rounded-md p-2 hover:bg-gray-100 focus:outline-none hover:dark:bg-gray-900">
            <span
              className={cx(
                "flex aspect-square size-7 items-center justify-center rounded bg-indigo-600 p-2 text-xs font-medium text-white dark:bg-indigo-500",
              )}
              aria-hidden="true"
            >
              {data?.name ? data.name.slice(0, 2).toUpperCase() : ""}
            </span>
            <RiArrowRightSLine
              className="size-4 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <div className="flex w-full items-center justify-between gap-x-3 truncate">
              <p className="truncate whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-50">
                {data?.name}
              </p>
              <RiExpandUpDownLine
                className="size-4 shrink-0 text-gray-500"
                aria-hidden="true"
              />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              Produits ({filteredProducts.length})
            </DropdownMenuLabel>
            {formatProductForDropdown(filteredProducts).map((workspace) => (
              <DropdownMenuItem key={workspace.value}>
                <div className="flex w-full items-center gap-x-2.5">
                  <span
                    className={cx(
                      workspace.color,
                      "flex aspect-square size-8 items-center justify-center rounded p-2 text-xs font-medium text-white",
                    )}
                    aria-hidden="true"
                  >
                    {workspace.initials}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                      {workspace.name}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-400">
                      {workspace.role}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

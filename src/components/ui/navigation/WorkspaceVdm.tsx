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

export const WorkspaceVdmDesktop = () => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [hasOpenDialog, setHasOpenDialog] = React.useState(false)
  const dropdownTriggerRef = React.useRef<null | HTMLButtonElement>(null)
  const focusRef = React.useRef<null | HTMLButtonElement>(null)

  const { workspace, setWorkspace, workspaces } = useWorkspaceContext()

  if (!workspace) {
    return null
  }

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
              {workspace?.name ? workspace.name.slice(0, 2).toUpperCase() : ""}
            </span>
            <div className="flex w-full items-center justify-between gap-x-4 truncate">
              <div className="truncate">
                <p className="truncate whitespace-nowrap text-left text-sm font-medium text-gray-900 dark:text-gray-50">
                  {workspace?.name}
                </p>
                <p className="whitespace-nowrap text-left text-xs text-gray-700 dark:text-gray-300">
                  Cliquer pour changer d'espace de travail
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
              Espace de travail ({workspaces.length})
            </DropdownMenuLabel>
            {workspaces
              ?.filter((ws) => ws.id !== workspace.id)
              ?.map((wss) => (
                <DropdownMenuItem
                  onClick={() => setWorkspace(wss)}
                  key={wss.id}
                >
                  <div className="flex w-full items-center gap-x-2.5">
                    <span
                      className={cx(
                        "bg-indigo-600 dark:bg-indigo-500",
                        "flex aspect-square size-8 items-center justify-center rounded p-2 text-xs font-medium text-white",
                      )}
                      aria-hidden="true"
                    >
                      {wss.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                        {wss.name}
                      </p>
                      {/* <p className="text-xs text-gray-700 dark:text-gray-400">
                      {workspace.role}
                    </p> */}
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

export const WorkspaceVdmMobile = () => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const { workspace, setWorkspace, workspaces } = useWorkspaceContext()

  console.log(
    "workspaces: ",
    workspaces.filter((ws) => ws.id !== workspace.id),
  )

  if (!workspace) return null

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
              {workspace?.name ? workspace.name.slice(0, 2).toUpperCase() : ""}
            </span>
            <RiArrowRightSLine
              className="size-4 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <div className="flex w-full items-center justify-between gap-x-3 truncate">
              <p className="truncate whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-50">
                {workspace?.name}
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
              Espace de travail ({workspaces?.length})
            </DropdownMenuLabel>
            {workspaces
              ?.filter((ws) => ws.id !== workspace.id)
              ?.map((wss) => (
                <DropdownMenuItem key={wss.id} onClick={() => setWorkspace(wss)}>
                  <div className="flex w-full items-center gap-x-2.5">
                    <span
                      className={cx(
                        "bg-indigo-600 dark:bg-indigo-500",
                        "flex aspect-square size-8 items-center justify-center rounded p-2 text-xs font-medium text-white",
                      )}
                      aria-hidden="true"
                    >
                      {wss.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                        {wss.name}
                      </p>
                      {/* <p className="text-xs text-gray-700 dark:text-gray-400">
                      {workspace.role}
                    </p> */}
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

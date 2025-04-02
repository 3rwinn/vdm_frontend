"use client"
import { siteConfig } from "@/app/siteConfig"
import { cx, focusRing } from "@/lib/utils"
import {
  RiHome2Line,
  RiLinkM,
  RiListCheck,
  RiSettings5Line,
  RiBarChartBoxLine,
} from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import MobileSidebar from "./MobileSidebar"
import { WorkspacesDropdownDesktop } from "./SidebarWorkspacesDropdown"
import { UserProfileDesktop, UserProfileMobile } from "./UserProfile"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useWorkspaceContext } from "@/context/WsContext"
import { WorkspaceVdmMobile } from "./WorkspaceVdm"
import { WorkspaceVdmDesktop } from "./WorkspaceVdm"
import { useProducts } from "@/hooks/useProducts"

const navigationAll = [
  {
    name: "Vue d'ensemble",
    href: siteConfig.baseLinks.dashboard.overview,
    icon: RiHome2Line,
  },
  {
    name: "Rapports",
    href: siteConfig.baseLinks.dashboard.details,
    icon: RiListCheck,
  },

  {
    name: "Paramètres",
    href: siteConfig.baseLinks.dashboard.settings.general,
    icon: RiSettings5Line,
  },
] as const

const navigationMep = [
  {
    name: "Vue d'ensemble",
    href: siteConfig.baseLinks.dashboard.overview,
    icon: RiHome2Line,
  },
  {
    name: "Rapports",
    href: siteConfig.baseLinks.dashboard.details,
    icon: RiListCheck,
  },
  {
    name: "Simulation",
    href: "/dashboard/simulation",
    icon: RiBarChartBoxLine,
  },
  {
    name: "Paramètres",
    href: siteConfig.baseLinks.dashboard.settings.general,
    icon: RiSettings5Line,
  },
] as const

const shortcuts = [
  {
    name: "Add new user",
    href: "/dashboard/settings/users",
    icon: RiLinkM,
  },
  {
    name: "Workspace usage",
    href: "/dashboard/settings/billing#billing-overview",
    icon: RiLinkM,
  },
  {
    name: "Cost spend control",
    href: "/dashboard/settings/billing#cost-spend-control",
    icon: RiLinkM,
  },
  {
    name: "Overview – Rows written",
    href: "/dashboard/overview#usage-overview",
    icon: RiLinkM,
  },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.dashboard.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref || pathname.startsWith(itemHref)
  }

  const { data: session, status } = useSession()

  const { workspace, isLoading: isWorkspaceLoading } = useWorkspaceContext()

  const { products } = useProducts()

  const product = products?.find((p) => workspace?.products?.includes(p.id))

  console.log("workspce_sidebar", workspace)
  console.log("worksapce_product", product)

  const navigation =
    product?.code === "MEP" ? navigationMep : navigationAll

  if (status === "unauthenticated") {
    return redirect("/login")
  }

  if (status === "loading") {
    return (
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex w-full items-center gap-x-2.5 rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex aspect-square size-8 items-center justify-center rounded bg-gray-200 dark:bg-gray-800" />
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col space-y-10">
            <div className="space-y-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-x-2.5 rounded-md px-2 py-1.5"
                >
                  <div className="size-4 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* sidebar (lg+) */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <aside className="flex grow flex-col gap-y-6 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          {isWorkspaceLoading ? (
            <div className="flex w-full items-center gap-x-2.5 rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex aspect-square size-8 items-center justify-center rounded bg-gray-200 dark:bg-gray-800" />
              <div className="flex w-full items-center justify-between gap-x-4">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                {/* <div className="size-5 rounded bg-gray-200 dark:bg-gray-800" /> */}
              </div>
            </div>
          ) : (
            <WorkspaceVdmDesktop />
          )}

          <nav
            aria-label="core navigation links"
            className="flex flex-1 flex-col space-y-10"
          >
            <ul role="list" className="space-y-0.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cx(
                      isActive(item.href)
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                      "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition hover:bg-gray-100 hover:dark:bg-gray-900",
                      focusRing,
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            {/* <div>
              <span className="text-xs font-medium leading-6 text-gray-500">
                Shortcuts
              </span>
              <ul aria-label="shortcuts" role="list" className="space-y-0.5">
                {shortcuts.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cx(
                        pathname === item.href || pathname.startsWith(item.href)
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                        "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition hover:bg-gray-100 hover:dark:bg-gray-900",
                        focusRing,
                      )}
                    >
                      <item.icon
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div> */}
          </nav>
          <div className="mt-auto">
            <UserProfileDesktop user={session?.user_data} />
          </div>
        </aside>
      </nav>
      {/* top navbar (xs-lg) */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-2 shadow-sm sm:gap-x-6 sm:px-4 lg:hidden dark:border-gray-800 dark:bg-gray-950">
        <WorkspaceVdmMobile data={workspace?.workspace} />
        <div className="flex items-center gap-1 sm:gap-2">
          <UserProfileMobile user={session?.user_data} />
          <MobileSidebar />
        </div>
      </div>
    </>
  )
}

import { type ReactNode, useMemo } from "react"
import { BarChart3, FileBarChart, LayoutDashboard, Settings, LogOut } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { clearSelectedWorkspace, getStoredWorkspace } from "@/lib/workspaces"
import { buildPath, paths } from "@/routes/paths"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspaceDropdown } from "@/hooks/use-workspace-dropdown"
import LogoVDM from "@/assets/images/logo-vdm.png"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { logout, tokens } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedWorkspace } = useWorkspaceDropdown({ accessToken: tokens?.access })
  const storedWorkspace = getStoredWorkspace().workspace
  const currentWorkspace = selectedWorkspace ?? storedWorkspace ?? null

  const hasMepProduct = useMemo(() => {
    const products = currentWorkspace?.products_details ?? []
    return products.some((product) => {
      const code = product?.code
      return typeof code === "string" && code.trim().toLowerCase() === "mep"
    })
  }, [currentWorkspace?.products_details])

  const navigationItems = useMemo(() => {
    const items = [
      { icon: LayoutDashboard, label: "Vue d’ensemble", path: paths.dashboard },
      { icon: FileBarChart, label: "Rapports", path: paths.reports },
    ]

    if (hasMepProduct) {
      items.push({ icon: BarChart3, label: "Simulation", path: paths.simulation })
    }

    items.push({ icon: Settings, label: "Paramètres", path: paths.settings })
    return items
  }, [hasMepProduct])

  const activePath = location.pathname

  const handleLogout = () => {
    logout()
    clearSelectedWorkspace()
    navigate(paths.login, { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-[#f3f6fb]">
      <aside className="hidden h-screen w-64 flex-col justify-between rounded-r-3xl bg-white p-8 text-sm text-muted-foreground shadow-lg lg:sticky lg:top-0 lg:flex">
        <div className="space-y-10">
          <img src={LogoVDM} alt="VDM" className="h-24 w-auto" />
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const isActive =
                item.path === paths.dashboard
                  ? activePath.startsWith(paths.dashboard)
                  : activePath.startsWith(item.path)
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.path === paths.dashboard) {
                      const stored = getStoredWorkspace()
                      if (stored.workspaceId) {
                        navigate(buildPath.dashboard(stored.workspaceId))
                      } else {
                        navigate(paths.workspaces)
                      }
                    } else {
                      navigate(item.path)
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-[#0c6e85] text-white shadow"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#e0552d] transition hover:bg-[#ffe8e1]"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </Button>
      </aside>

      <main className="flex-1 max-h-screen overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
        {children}
      </main>
    </div>
  )
}

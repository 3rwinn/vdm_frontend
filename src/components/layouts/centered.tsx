import { Outlet } from "react-router-dom"

export function CenteredLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Outlet />
    </div>
  )
}

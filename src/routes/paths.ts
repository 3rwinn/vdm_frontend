export const paths = {
  register: "/register",
  login: "/login",
  verify: "/verify",
  workspaces: "/workspaces",
  dashboard: "/dashboard",
  reports: "/reports",
  simulation: "/simulation",
  settings: "/parametre",
} as const

export const routePatterns = {
  dashboard: `${paths.dashboard}/:workspaceId`,
} as const

export const buildPath = {
  dashboard: (workspaceId: string | number) => `${paths.dashboard}/${workspaceId}`,
} as const

export type AppPath =
  | typeof paths[keyof typeof paths]
  | ReturnType<typeof buildPath["dashboard"]>

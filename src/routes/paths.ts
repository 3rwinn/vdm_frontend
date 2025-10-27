export const paths = {
  register: "/register",
  login: "/login",
  verify: "/verify",
  workspaces: "/workspaces",
  dashboard: "/dashboard",
  reports: "/reports",
  simulation: "/simulation",
  settings: "/parametre",
  invitation: "/invitation",
} as const

export const routePatterns = {
  dashboard: `${paths.dashboard}/:workspaceId`,
  invitation: `${paths.invitation}/:token`,
} as const

export const buildPath = {
  dashboard: (workspaceId: string | number) => `${paths.dashboard}/${workspaceId}`,
  invitation: (token: string) => `${paths.invitation}/${token}`,
} as const

export type AppPath =
  | typeof paths[keyof typeof paths]
  | ReturnType<typeof buildPath["dashboard"]>
  | ReturnType<typeof buildPath["invitation"]>

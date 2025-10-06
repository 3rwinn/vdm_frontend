export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

type RequestOptions = RequestInit & { parseJson?: boolean; token?: string }

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { parseJson = true, headers, token, ...rest } = options
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    let errorMessage = response.statusText
    try {
      const data = await response.json()
      errorMessage = data?.error || data?.message || JSON.stringify(data)
    } catch {
      // ignore json errors
    }
    throw new Error(errorMessage || "Une erreur est survenue")
  }

  if (!parseJson) {
    return undefined as T
  }

  return (await response.json()) as T
}

export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
}

export interface VerifyPayload {
  email: string
  code: string
}

export interface VerifyResponse {
  refresh: string
  access: string
  user_data: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
}

export function registerUser(payload: RegisterPayload) {
  return request<{ message: string }>("/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function requestValidationCode(email: string) {
  return request<{ message: string }>("/request-code/", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function verifyValidationCode(payload: VerifyPayload) {
  return request<VerifyResponse>("/verify-code/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export interface ProductResponse {
  id: number
  name: string
  features: string
  price: string
  code?: string | null
}

export function fetchProducts() {
  return request<ProductResponse[]>('/products/')
}

export interface WorkspaceMemberResponse {
  id: number
  role: string
  email: string
  first_name: string
  last_name: string
}

export interface WorkspaceResponse {
  id: number
  name: string
  created_at: string
  updated_at: string
  owner: {
    id: number
    email: string
    first_name: string
    last_name: string
  } | null
  members: WorkspaceMemberResponse[]
  products: unknown[]
  products_details: ProductResponse[]
  type_client: string | null
  sector_activity: string | null
  id_client: string | null
  paystack_subscription_plan: string | null
  paystack_subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_active: boolean
}

export interface CreateWorkspacePayload {
  name: string
  type_client: string
  sector_activity: string
  id_client: string
  paystack_subscription_plan: string
  products: Array<number | string | Record<string, unknown>>
}

export function fetchWorkspaces(token: string) {
  return request<WorkspaceResponse[]>('/workspaces/', {
    token,
  })
}

export function createWorkspace(payload: CreateWorkspacePayload, token: string) {
  return request<WorkspaceResponse>('/workspaces/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

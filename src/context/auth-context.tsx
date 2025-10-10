/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  registerUser,
  requestValidationCode,
  verifyValidationCode,
  type RegisterPayload,
  type VerifyPayload,
  type VerifyResponse,
} from "@/lib/api"

interface AuthContextValue {
  tokens: VerifyResponse | null
  user: VerifyResponse["user_data"] | null
  isAuthenticated: boolean
  pendingEmail: string | null
  register: (payload: RegisterPayload) => Promise<void>
  requestCode: (email: string) => Promise<void>
  verifyCode: (payload: VerifyPayload) => Promise<VerifyResponse>
  logout: () => void
  setPendingEmail: (email: string | null) => void
}

const AUTH_STORAGE_KEY = "vdm.auth.tokens"
const PENDING_EMAIL_STORAGE_KEY = "vdm.auth.pendingEmail"

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredTokens(): VerifyResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as VerifyResponse
  } catch (error) {
    console.error("Invalid auth payload", error)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function getStoredPendingEmail(): string | null {
  return sessionStorage.getItem(PENDING_EMAIL_STORAGE_KEY)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [tokens, setTokens] = useState<VerifyResponse | null>(() => getStoredTokens())
  const [pendingEmail, setPendingEmailState] = useState<string | null>(getStoredPendingEmail)

  useEffect(() => {
    if (tokens) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [tokens])

  const setPendingEmail = useCallback((email: string | null) => {
    setPendingEmailState(email)
    if (email) {
      sessionStorage.setItem(PENDING_EMAIL_STORAGE_KEY, email)
    } else {
      sessionStorage.removeItem(PENDING_EMAIL_STORAGE_KEY)
    }
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload)
    await requestValidationCode(payload.email)
    setPendingEmail(payload.email)
  }, [setPendingEmail])

  const requestCode = useCallback(async (email: string) => {
    await requestValidationCode(email)
    setPendingEmail(email)
  }, [setPendingEmail])

  const verifyCode = useCallback(
    async (payload: VerifyPayload) => {
      const response = await verifyValidationCode(payload)
      setTokens(response)
      setPendingEmail(null)
      return response
    },
    [setPendingEmail]
  )

  const logout = useCallback(() => {
    setTokens(null)
    setPendingEmail(null)
  }, [setPendingEmail])

  const value = useMemo<AuthContextValue>(() => ({
    tokens,
    user: tokens?.user_data ?? null,
    isAuthenticated: Boolean(tokens?.access),
    pendingEmail,
    register,
    requestCode,
    verifyCode,
    logout,
    setPendingEmail,
  }), [tokens, pendingEmail, register, requestCode, verifyCode, logout, setPendingEmail])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}

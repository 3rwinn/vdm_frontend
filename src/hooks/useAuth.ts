import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem("vdm_accessToken")
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("vdm_accessToken", accessToken)
    localStorage.setItem("vdm_refreshToken", refreshToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("vdm_accessToken")
    localStorage.removeItem("vdm_refreshToken")
    setIsAuthenticated(false)
    router.push("/login")
  }

  return { isAuthenticated, isLoading, checkAuth, login, logout }
}

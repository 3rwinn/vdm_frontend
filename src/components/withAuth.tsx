import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export function withAuth(WrappedComponent: any) {
  return function AuthenticatedComponent(props: any) {
    const { isAuthenticated, isLoading, checkAuth } = useAuth()

    const router = useRouter()

    useEffect(() => {
      checkAuth()
    }, [])

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/login")
      }
    }, [isLoading, isAuthenticated])

    if (isLoading) {
      return <div>Chargement...</div>
      //   return null // or a loading spinner
    }

    return <WrappedComponent {...props} />
  }
}

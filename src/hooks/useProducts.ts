import { useState, useEffect } from "react"

interface Product {
  id: number
  name: string
  features: string
  price: number
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userToken = localStorage.getItem("vdm_accessToken")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("vdm_accessToken")

      // const headers: Record<string, string> = {
      //   'Content-Type': 'application/json'
      // }
      // if (token) {
      //   headers.Authorization = `Bearer ${token}`
      // }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/`,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    token: userToken,
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  }
}

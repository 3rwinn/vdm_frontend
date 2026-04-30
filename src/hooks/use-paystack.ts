import { useCallback, useMemo } from "react"

import PaystackPop from "@paystack/inline-js"

interface PaystackSuccessPayload {
  reference: string
  id: number
  message: string
}

interface PaystackLoadPayload {
  id: number
  accessCode: string
  customer: Record<string, unknown>
}

interface StartTransactionOptions {
  email: string
  amountKobo: number
  currency?: string
  metadata?: Record<string, unknown>
  reference?: string
  firstName?: string
  lastName?: string
  onSuccess?: (payload: PaystackSuccessPayload) => void
  onCancel?: () => void
  onError?: (error: Error) => void
  onLoad?: (payload: PaystackLoadPayload) => void
}

interface UsePaystackResult {
  isConfigured: boolean
  startTransaction: (options: StartTransactionOptions) => void
}

// Use `||` (not `??`) so an empty-string env var — Dockerfile ARG declared
// but Build Arg missing in Dokploy — is treated the same as missing.
const PAYSTACK_PUBLIC_KEY = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "").trim() || ""

export function usePaystack(): UsePaystackResult {
  const paystackPop = useMemo(() => new PaystackPop(), [])

  const startTransaction = useCallback(
    ({
      amountKobo,
      email,
      currency = "XOF",
      metadata,
      reference,
      firstName,
      lastName,
      onSuccess,
      onCancel,
      onError,
      onLoad,
    }: StartTransactionOptions) => {
      if (!PAYSTACK_PUBLIC_KEY) {
        onError?.(new Error("Clé publique Paystack indisponible."))
        return
      }

      if (!email) {
        onError?.(new Error("Adresse email requise pour le paiement."))
        return
      }

      if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
        onError?.(new Error("Montant Paystack invalide."))
        return
      }

      try {
        const transactionOptions: Record<string, unknown> = {
          key: PAYSTACK_PUBLIC_KEY,
          amount: Math.round(amountKobo),
          email,
          currency,
          onSuccess: (payload: { reference: string; id: number; message: string }) => {
            onSuccess?.({
              reference: payload.reference,
              id: payload.id,
              message: payload.message,
            })
          },
          onCancel,
          onLoad: (payload: { id: number; accessCode: string; customer?: Record<string, unknown> }) => {
            onLoad?.({
              id: payload.id,
              accessCode: payload.accessCode,
              customer: payload.customer ?? {},
            })
          },
          onError: (payload: { message?: string } | Error) => {
            const error =
              payload instanceof Error
                ? payload
                : new Error(payload?.message ?? "Erreur Paystack inconnue.")
            onError?.(error)
          },
        }

        if (metadata && Object.keys(metadata).length > 0) {
          transactionOptions.metadata = metadata
        }
        if (firstName) {
          transactionOptions.firstName = firstName
        }
        if (lastName) {
          transactionOptions.lastName = lastName
        }
        if (reference && typeof reference === "string") {
          transactionOptions.reference = reference
        }

        paystackPop.newTransaction(transactionOptions)
      } catch (error) {
        console.log("ERRRORR", error)
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                typeof error === "string" && error.trim()
                  ? error
                  : "Impossible d'initialiser Paystack."
              )
        onError?.(normalized)
      }
    },
    [paystackPop]
  )

  return {
    isConfigured: Boolean(PAYSTACK_PUBLIC_KEY),
    startTransaction,
  }
}

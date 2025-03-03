const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export async function registerUser(userData: any) {
  const response = await fetch(`${API_URL}/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })

  console.log("res", response)

  if (!response.ok) {
    throw new Error("Registration failed")
  }

  return response.json()
}

export async function requestValidationCode(email: string) {
  const response = await fetch(`${API_URL}/request-code/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    throw new Error("Failed to request validation code")
  }

  return response.json()
}

export async function verifyValidationCode(email: string, code: string) {
  const response = await fetch(`${API_URL}/verify-code/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  })

  if (!response.ok) {
    throw new Error("Code verification failed")
  }

  return response.json()
}

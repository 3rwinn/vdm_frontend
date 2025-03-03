import { NextResponse } from "next/server"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const backendResponse = await fetch(`${backendUrl}/api/request-code/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!backendResponse.ok) {
      throw new Error("Backend request failed")
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error requesting code:", error)
    return NextResponse.json(
      { error: "Failed to request code" },
      { status: 500 },
    )
  }
}

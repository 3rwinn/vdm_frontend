import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { firstName, lastName, email } = await request.json()

    console.log("firstName", firstName)
    console.log("lastName", lastName)
    console.log("email", email)

    // Validate input
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      )
    }

    // Call your Django backend to register the user
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const response = await fetch(`${backendUrl}/api/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Registration failed" },
        { status: response.status },
      )
    }

    return NextResponse.json({ message: "User registered successfully" })
  } catch (error) {
    console.error("Error in register route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

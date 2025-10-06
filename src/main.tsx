import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"

import { AuthProvider } from "@/context/auth-context"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-center" richColors expand closeButton />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

import { type ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const steps = [
  { id: "register", label: "Créer" },
  { id: "login", label: "Code" },
  { id: "verify", label: "Valider" },
  { id: "dashboard", label: "Connecté" },
] as const

export type AuthStepId = (typeof steps)[number]["id"]

interface AuthShellProps {
  title: string
  description: string
  currentStep?: AuthStepId
  children: ReactNode
  footer?: ReactNode
  messageSlot?: ReactNode
}

export function AuthShell({ title, description, currentStep, children, footer, messageSlot }: AuthShellProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-2 text-xs uppercase text-muted-foreground">
          {steps.map((step) => (
            <span
              key={step.id}
              className={cn(
                "rounded-full px-3 py-1 text-[0.65rem] font-semibold",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          ))}
        </div>
        {messageSlot}
        {children}
      </CardContent>
      {footer ? <CardFooter className="flex flex-col items-start gap-2">{footer}</CardFooter> : null}
    </Card>
  )
}

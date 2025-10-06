import { useField } from "formik"
import { useId, type InputHTMLAttributes } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string
  label: string
  hint?: string
  containerClassName?: string
  validate?: (value: string) => string | undefined
}

export function TextField({
  name,
  label,
  hint,
  className,
  containerClassName,
  id: providedId,
  validate,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const id = providedId ?? `${name}-${generatedId}`
  const [field, meta] = useField({ name, type: props.type, validate })

  const showError = meta.touched && meta.error

  return (
    <div className={cn("space-y-2.5", containerClassName)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        {...field}
        {...props}
        className={cn(
          "h-11 mt-2 rounded-lg border border-border/80 text-base shadow-sm focus:border-[#026c7a] focus-visible:ring-[#60b5c2]/40",
          showError && "border-destructive focus:border-destructive focus-visible:ring-destructive/30",
          className
        )}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {showError ? (
        <p className="text-xs font-medium text-destructive">{meta.error}</p>
      ) : null}
    </div>
  )
}

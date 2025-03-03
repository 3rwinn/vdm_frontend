import { ReactNode } from "react"
import { useFormikContext } from "formik"
import { Button } from "../Button"

interface SubmitButtonProps {
  loading?: boolean
  className?: string
  disabled?: boolean
  children: ReactNode
}

function SubmitButton({
  className,
  loading = false,
  disabled = false,
  children,
}: SubmitButtonProps) {
  const { submitForm } = useFormikContext()

  if (loading === true)
    return (
      <Button isLoading loadingText="Chargement...">
        Chargement
      </Button>
    )
  return (
    <Button className={className} disabled={disabled} onClick={submitForm}>
      {children}
    </Button>
  )
}

export default SubmitButton

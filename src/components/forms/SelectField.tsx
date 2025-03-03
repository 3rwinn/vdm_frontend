import { useFormikContext } from "formik"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"

type Option = {
  value: string | number
  label: string
}

type Props = {
  name: string
  options: Option[]
  label?: string
  placeholder?: string
  className?: string
  sideEvent?: (value: string) => void
}

interface FormValues {
  [key: string]: string | number
}

function SelectField({
  name,
  options,
  label,
  placeholder = "Select an option",
  className,
  sideEvent,
}: Props) {
  const { setFieldValue, setFieldTouched, touched, errors, values } =
    useFormikContext<FormValues>()

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-50"
        >
          {label}
        </label>
      )}

      <Select
        hasError
        value={values[name]}
        onValueChange={(value) => {
          setFieldValue(name, value)
          sideEvent?.(value)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {errors[name] && touched[name] && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  )
}

export default SelectField

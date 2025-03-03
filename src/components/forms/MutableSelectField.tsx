import { useFormikContext } from "formik"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { useEffect } from "react"
import { useState } from "react"

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
}

interface FormValues {
  [key: string]: string | number
}

function MutableSelectField({
  name,
  options,
  label,
  placeholder = "Choisir une option",
  className,
}: Props) {
  const { setFieldValue, setFieldTouched, touched, errors, values } =
    useFormikContext<FormValues>()

  if (label === "none" || options?.length === 0 || !options) {
    return (
      <div className="space-y-2">
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

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
        onValueChange={(value) => setFieldValue(name, value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
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

export default MutableSelectField

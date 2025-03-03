import React from "react"
import { Input } from "../Input"
import { useFormikContext } from "formik"

interface Params {
  label: string
  name: string
  type: string
  placeholder?: string
  caption?: string
  disabled?: boolean
}

interface FormValues {
  [key: string]: string
}

function FormField({
  label,
  type,
  name,
  placeholder,
  caption,
  disabled,
}: Params) {
  const { setFieldTouched, setFieldValue, errors, touched, values } =
    useFormikContext<FormValues>()
  return (
    <div className="mb-2 grid gap-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-900 dark:text-gray-50"
      >
        {label}
      </label>
      <Input
        type={type}
        id={name}
        disabled={disabled}
        name={name}
        value={values[name]}
        placeholder={placeholder}
        onChange={(params) => setFieldValue(name, params.target.value)}
        onBlur={() => setFieldTouched(name)}
        className="mt-2"
      />
      {errors[name] && touched[name] && (
        <p className="text-sm text-red-600" id={`${name}-error"`}>
          {errors[name]}
        </p>
      )}
      {caption && (
        <p className="text-sm text-gray-500" id={`${name}-description"`}>
          {caption}
        </p>
      )}
    </div>
  )
}

export default FormField

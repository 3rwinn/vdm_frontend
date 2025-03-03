import { useFormikContext } from "formik"
import { Badge } from "../Badge"
import { cx } from "@/lib/utils"
// import { ChevronUpDownIcon } from "@remixicon/react"
import { useState, useRef, useEffect } from "react"

type Params = {
  name: string
  datas: any[]
  placeholder?: string
}

interface FormValues {
  [key: string]: number
}

function SpecialSelectField({ name, datas, placeholder = "Select an option" }: Params) {
  const { setFieldValue, setFieldTouched, touched, errors, values } =
    useFormikContext<FormValues>()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelection(id: number) {
    setFieldValue(name, id)
    setFieldTouched(name, true)
    setIsOpen(false)
  }

  const selectedItem = datas.find(item => item.id === values[name])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cx(
          "cursor-pointer rounded-lg bg-gray-50 p-6 ring-1 ring-inset transition-all",
          "ring-gray-200 dark:bg-gray-400/10 dark:ring-gray-800",
          "hover:bg-gray-100 dark:hover:bg-gray-700/30"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            {selectedItem ? (
              <>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {selectedItem.name}
                </h4>
                <ul className="mt-2 flex flex-row space-x-2">
                  {selectedItem.items.map((item: string, index: number) => (
                    <li key={index}>
                      <Badge variant="neutral">{item}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          {/* <ChevronUpDownIcon className="h-5 w-5 text-gray-400" /> */}
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
          <div className="max-h-60 overflow-auto py-1">
            {datas.map((data, index) => (
              <div
                key={index}
                className={cx(
                  "cursor-pointer p-4 transition-all",
                  values[name] === data.id
                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                )}
                onClick={() => handleSelection(data.id)}
              >
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {data.name}
                </h4>
                <ul className="mt-2 flex flex-row space-x-2">
                  {data.items.map((item: string, index: number) => (
                    <li key={index}>
                      <Badge variant="neutral">{item}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors[name] && touched[name] && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error"`}>
          {errors[name]}
        </p>
      )}
    </div>
  )
}

export default SpecialSelectField
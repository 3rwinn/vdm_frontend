import { Checkbox } from "@/components/Checkbox"
import { useFormikContext } from "formik"
import { Badge } from "../Badge"
import { cx } from "@/lib/utils"

type Params = {
  name: string
  datas: any[]
}

interface FormValues {
  [key: string]: number[]
}

function SpecialCheckboxField({ name, datas }: Params) {
  const { setFieldValue, setFieldTouched, touched, errors, values } =
    useFormikContext<FormValues>()

  function handleProductSelection(id: number) {
    setFieldValue(
      name,
      values[name].includes(id)
        ? values[name].filter((item: number) => item !== id)
        : [...values[name], id],
    )
    setFieldTouched(name, true)
  }

  return (
    <div className="mt-6 flex flex-col space-y-4">
      {datas.map((data, index) => {
        return (
          <div
            key={index}
            className={cx(
              "cursor-pointer rounded-lg bg-gray-50 p-6 ring-1 ring-inset transition-all",
              values[name].includes(data.id)
                ? "ring-2 ring-indigo-600 dark:ring-indigo-500"
                : "ring-gray-200 dark:bg-gray-400/10 dark:ring-gray-800",
              "hover:bg-gray-100 dark:hover:bg-gray-700/30",
            )}
            onClick={() => handleProductSelection(data.id)}
          >
            <div className="flex items-center">
              <Checkbox
                className="mr-3 h-5 w-5 rounded border-gray-300"
                checked={values[name].includes(data.id)}
                onCheckedChange={() => {}}
              />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {data.name}
              </h4>
            </div>
            <ul className="mt-2 flex flex-row space-x-2">
              {data.items.map((item, index) => (
                <li key={index}>
                  <Badge variant="neutral">{item}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {errors[name] && touched[name] && (
        <p className="text-sm text-red-600" id={`${name}-error"`}>
          {errors[name]}
        </p>
      )}
    </div>
  )
}

export default SpecialCheckboxField

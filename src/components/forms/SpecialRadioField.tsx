import { Checkbox } from "@/components/Checkbox"
import { useFormikContext } from "formik"
import { Badge } from "../Badge"
import { cx } from "@/lib/utils"

type Params = {
  name: string
  datas: any[],
  sideEvent?: (value: string) => void;
}

interface FormValues {
  [key: string]: number // Changed from number[] to number for single selection
}

function SpecialRadioField({ name, datas, sideEvent }: Params) {
  const { setFieldValue, setFieldTouched, touched, errors, values } =
    useFormikContext<FormValues>()

  function handleSelection(id: number) {
    // Simply set the value instead of managing an array
    setFieldValue(name, id)
    setFieldTouched(name, true)

    // Send specific data to sideEvent
    if(sideEvent) {
      const dataToSend = datas.find(element => element.id === values[name])
      sideEvent(dataToSend?.code)
    }
    
  }

  return (
    <div className="mt-6 flex flex-col space-y-4">
      {datas.map((data, index) => {
        const isSelected = values[name] === data.id // Changed from includes() to ===
        return (
          <div
            key={index}
            className={cx(
              "cursor-pointer rounded-lg bg-gray-50 p-6 ring-1 ring-inset transition-all",
              isSelected
                ? "ring-2 ring-indigo-600 dark:ring-indigo-500"
                : "ring-gray-200 dark:bg-gray-400/10 dark:ring-gray-800",
              "hover:bg-gray-100 dark:hover:bg-gray-700/30",
            )}
            onClick={() => handleSelection(data.id)}
          >
            <div className="flex items-center">
              <Checkbox
                className="mr-3 h-5 w-5 rounded-full border-gray-300" // Added rounded-full for radio appearance
                checked={isSelected}
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

export default SpecialRadioField
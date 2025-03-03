import { RiBarChartFill } from "@remixicon/react"

function EmptyDatas({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <div className="mt-4 flex h-52 items-center justify-center rounded-md border border-dashed border-gray-300 p-4 dark:border-gray-800">
        <div className="text-center">
          <RiBarChartFill
            className="mx-auto size-7 text-gray-400 dark:text-gray-600"
            aria-hidden={true}
          />
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {description}
          </p>
          {/* <Button className="mt-6">
        <RiAddFill className="-ml-1 size-5 shrink-0" aria-hidden={true} />
        Add database
      </Button> */}
        </div>
      </div>
    </>
  )
}

export default EmptyDatas

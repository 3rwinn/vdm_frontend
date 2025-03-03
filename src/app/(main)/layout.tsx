import { Toaster } from "@/components/Toaster"
import { DatabaseLogo } from "../../../public/DatabaseLogo"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
    <Toaster />
    <div className="mt-[22px]">
      <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <DatabaseLogo className="mb-12 h-10" />
        {/* <div className="sm:mx-auto sm:w-full sm:max-w-sm">{children}</div> */}
        <div className="sm:mx-auto w-[500px]">{children}</div>
      </div>
    </div>
    </>
  )
}

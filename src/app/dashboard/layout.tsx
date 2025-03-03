import { Sidebar } from "@/components/ui/navigation/Sidebar"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <Sidebar />
      <main className="lg:pl-72">{children}</main>
    </div>
  )
}

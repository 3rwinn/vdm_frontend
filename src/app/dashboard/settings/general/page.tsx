"use client"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { useSession } from "next-auth/react"
import { useWorkspaceContext } from "@/context/WsContext"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
// import { toast } from "sonner"

export default function General() {
  const router = useRouter()
  const { data: session } = useSession()
  const { workspace, updateWorkspace, deleteWorkspace, setWorkspace } =
    useWorkspaceContext()
  const [isDeleting, setIsDeleting] = useState(false)
  const [workspaceData, setWorkspaceData] = useState({
    name: "",
    owner: "",
    products: [],
    type_client: "",
    sector_activity: "",
    id_client: "",
    months: [],
  })

  console.log("settings_workspace", workspace)

  // Update workspace data when workspace is loaded
  useEffect(() => {
    if (workspace) {
      setWorkspaceData({
        name: workspace.name || "",
        // owner: workspace.workspace.owner || "",
        // products: workspace.workspace.products || [],
        // type_client: workspace.workspace.type_client || "",
        sector_activity: workspace.sector_activity || "",
        // id_client: workspace.workspace.id_client || "",
        // months: workspace.workspace.months || [],
      })
    }
  }, [workspace])

  // Handle workspace update
  const handleWorkspaceUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateWorkspace(workspace?.id, workspaceData)
      // toast.success("Workspace updated successfully")
    } catch (error) {
      // toast.error("Failed to update workspace")
      console.error("Error updating workspace:", error)
    }
  }

  // Handle workspace deletion
  const handleWorkspaceDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteWorkspace(workspace?.id)
      // toast.success("Workspace deleted successfully")
      // router.replace("/onboarding")
      setWorkspace(null)
    } catch (error) {
      // toast.error("Failed to delete workspace")
      console.error("Error deleting workspace:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (!workspace) {
      router.push("/onboarding")
    }
  }, [workspace, router])

  return (
    <>
      <div className="space-y-10">
        <section aria-labelledby="personal-information">
          <form>
            <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
              <div>
                <h2
                  id="personal-information"
                  className="scroll-mt-10 font-semibold text-gray-900 dark:text-gray-50"
                >
                  Informations personnelles
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Vos informations personnelles.
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                  <div className="col-span-full sm:col-span-3">
                    <Label htmlFor="first-name" className="font-medium">
                      Prénom
                    </Label>
                    <Input
                      type="text"
                      id="first-name"
                      name="first-name"
                      value={session?.user_data?.first_name || ""}
                      disabled
                      className="mt-2"
                    />
                  </div>
                  <div className="col-span-full sm:col-span-3">
                    <Label htmlFor="last-name" className="font-medium">
                      Nom
                    </Label>
                    <Input
                      type="text"
                      id="last-name"
                      name="last-name"
                      value={session?.user_data?.last_name || ""}
                      disabled
                      className="mt-2"
                    />
                  </div>
                  <div className="col-span-full">
                    <Label htmlFor="email" className="font-medium">
                      Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={session?.user_data?.email || ""}
                      disabled
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </section>
        <Divider />

        <section aria-labelledby="workspace-settings">
          <form onSubmit={handleWorkspaceUpdate}>
            <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
              <div>
                <h2
                  id="workspace-settings"
                  className="scroll-mt-10 font-semibold text-gray-900 dark:text-gray-50"
                >
                  Espaces de travail
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Mettez à jour les informations de votre espace de travail.
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4">
                  <div className="col-span-full">
                    <Label htmlFor="workspace-name" className="font-medium">
                      Nom de l'espace de travail
                    </Label>
                    <Input
                      type="text"
                      id="workspace-name"
                      value={workspaceData.name}
                      onChange={(e) =>
                        setWorkspaceData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                  {/* <div className="col-span-full">
                    <Label htmlFor="workspace-client" className="font-medium">
                      Client ID
                    </Label>
                    <Input
                      type="text"
                      id="workspace-client"
                      value={workspaceData.id_client}
                      onChange={(e) =>
                        setWorkspaceData((prev) => ({
                          ...prev,
                          id_client: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div> */}
                  <div className="col-span-full">
                    <Label htmlFor="workspace-sector" className="font-medium">
                      Secteur d'activité
                    </Label>
                    <Input
                      type="text"
                      id="workspace-sector"
                      disabled
                      value={workspaceData.sector_activity}
                      // onChange={(e) =>
                      //   setWorkspaceData((prev) => ({
                      //     ...prev,
                      //     sector_activity: e.target.value,
                      //   }))
                      // }
                      className="mt-2"
                    />
                  </div>
                  <div className="col-span-full mt-6 flex justify-end">
                    <Button type="submit">Enregistrer</Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </section>
        <Divider />

        <section aria-labelledby="danger-zone">
          <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
            <div>
              <h2
                id="danger-zone"
                className="scroll-mt-10 font-semibold text-gray-900 dark:text-gray-50"
              >
                Zone de danger
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Gérer la suppression de l'espace de travail. Cette action ne
                peut pas être annulée.
              </p>
            </div>
            <div className="space-y-6 md:col-span-2">
              <Card className="overflow-hidden p-0">
                <div className="flex items-start justify-between gap-10 p-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      Supprimer l'espace de travail
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Cette action supprimera définitivement votre espace de
                      travail et tous les éléments associés.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="whitespace-nowrap text-red-600 dark:text-red-500"
                    onClick={handleWorkspaceDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? "Suppression en cours..."
                      : "Supprimer l'espace de travail"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

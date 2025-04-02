"use client"
import { useWorkspaceContext } from "@/context/WsContext"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { DateRangePicker } from "@/components/DatePicker"
import { Badge } from "@/components/Badge"
import { Divider } from "@/components/Divider"
import { ProgressBar } from "@/components/ProgressBar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DonutChart } from "@/components/DonutChart"
import { BarChart } from "@/components/BarChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { futurePresets } from "@/lib/dateHelpers"

// Define types for our simulation results
type TimeSlot = number
type ChannelAllocation = {
  suggested_investment: number
  optimal_time_slots: TimeSlot[]
  impact_level: "Faible" | "Moyen" | "Elevé"
  estimated_spots: number
  avg_duration: number
  avg_cost_per_spot: number
  current_share: string
}

type SimulationResults = {
  success: boolean
  recommendations: {
    is_new_advertiser: boolean
    sector: string
    channel_allocation: Record<string, ChannelAllocation>
    total_budget: number
    duration: number
    campaign_period: {
      start: string
      end: string
      total_days: number
    }
  }
}

export default function SimulationPage() {
  const { workspace, getRecommendation } = useWorkspaceContext()
  const router = useRouter()

  // State for form fields
  const [amount, setAmount] = useState<string>("")
  const [duration, setDuration] = useState<string>("30")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({  
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  })
  
  // State for simulation results
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Format dates for API
      const dateFrom = format(dateRange.from, "yyyy-MM-dd")
      const dateTo = format(dateRange.to, "yyyy-MM-dd")
      
      // Get advertiser from workspace
      const advertiser = workspace?.id_client || "unknown"
      
      // Call the API
      const data = await getRecommendation(
        advertiser,
        parseInt(amount),
        parseInt(duration),
        dateFrom,
        dateTo
      )
      
      // Set results
      setResults(data)
      setActiveTab("overview")
    } catch (error) {
      console.error("Error getting recommendation:", error)
      // You could add error handling UI here
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get impact level badge color
  const getImpactColor = (level: string) => {
    switch(level) {
      case "Elevé": return "success";
      case "Moyen": return "warning";
      case "Faible": return "error";
      default: return "default";
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      maximumFractionDigits: 0 
    }).format(amount);
  }

  // Format time slot
  const formatTimeSlot = (slot: number) => {
    return `${slot}:00 - ${slot+1}:00`;
  }

  // Prepare data for charts
  const prepareDonutChartData = () => {
    if (!results) return [];
    
    return Object.entries(results.recommendations.channel_allocation).map(([channel, data]) => ({
      name: channel,
      value: data.suggested_investment
    }));
  }

  const prepareTimeSlotData = () => {
    if (!results) return [];
    
    // Count occurrences of each time slot across all channels
    const slotCounts = {};
    
    Object.values(results.recommendations.channel_allocation).forEach(channel => {
      channel.optimal_time_slots.forEach(slot => {
        slotCounts[slot] = (slotCounts[slot] || 0) + 1;
      });
    });
    
    // Convert to array format for BarChart
    return Object.entries(slotCounts).map(([slot, count]) => ({
      timeSlot: formatTimeSlot(parseInt(slot)),
      "Nombre de chaînes": count
    })).sort((a, b) => {
      // Sort by time slot
      const timeA = parseInt(a.timeSlot.split(':')[0]);
      const timeB = parseInt(b.timeSlot.split(':')[0]);
      return timeA - timeB;
    });
  }

  // Prepare cost comparison data
  const prepareCostComparisonData = () => {
    if (!results) return [];
    
    return Object.entries(results.recommendations.channel_allocation).map(([channel, data]) => ({
      channel,
      cost: data.avg_cost_per_spot
    }));
  }

  // Redirect to onboarding if no workspace is selected
  if (!workspace) {
    router.push("/onboarding")
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
          Simulation
        </h1>

        <div className="mt-8 w-full">
          <Card className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    Paramètres de simulation
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Configurez les paramètres pour simuler votre campagne
                    publicitaire.
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="date-range"
                    className="block text-sm font-medium"
                  >
                    Période de diffusion
                  </Label>
                  <div className="mt-1">
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      className="w-full"
                      translations={{
                        cancel: "Annuler",
                        apply: "Appliquer",
                        range: "Intervalle de dates",
                      }}
                      locale={fr}
                      presets={futurePresets}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="amount"
                      className="block text-sm font-medium"
                    >
                      Budget (FCFA)
                    </Label>
                    <div className="mt-1">
                      <Input
                        type="number"
                        id="amount"
                        name="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ex: 1000000"
                        className="block w-full"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="duration"
                      className="block text-sm font-medium"
                    >
                      Durée de la pub (secondes)
                    </Label>
                    <div className="mt-1">
                      <Input
                        type="number"
                        id="duration"
                        name="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Ex: 30"
                        className="block w-full"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAmount("")
                      setDuration("30")
                      setDateRange({
                        from: new Date(),
                        to: new Date(
                          new Date().setMonth(new Date().getMonth() + 1),
                        ),
                      })
                      setResults(null)
                    }}
                  >
                    Réinitialiser
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Chargement..." : "Lancer la simulation"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {results ? (
            <div className="mt-8 space-y-6">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="channels">Chaînes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card className="p-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                        Résumé de la simulation
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <p className="text-sm font-medium text-gray-500">Secteur</p>
                          <p className="mt-1 text-xl font-semibold">{results.recommendations.sector}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <p className="text-sm font-medium text-gray-500">Budget total</p>
                          <p className="mt-1 text-xl font-semibold">{formatCurrency(results.recommendations.total_budget)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <p className="text-sm font-medium text-gray-500">Durée du spot</p>
                          <p className="mt-1 text-xl font-semibold">{results.recommendations.duration} secondes</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <p className="text-sm font-medium text-gray-500">Période de campagne</p>
                          <p className="mt-1 text-sm font-semibold">
                            {format(new Date(results.recommendations.campaign_period.start), "dd MMM yyyy", { locale: fr })} - {format(new Date(results.recommendations.campaign_period.end), "dd MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs text-gray-500">({results.recommendations.campaign_period.total_days} jours)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-4 text-base font-medium text-center">Répartition du budget</h4>
                        <div className="flex justify-center">
                          <DonutChart
                            data={prepareDonutChartData()}
                            category="value"
                            index="name"
                            valueFormatter={formatCurrency}
                            className="h-80 max-w-md"
                            colors={["indigo", "cyan", "amber", "yellow"]}
                            showLabel={false}
                            showTooltip={false}
                            showLegend={false}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4">
                          {results && Object.entries(results.recommendations.channel_allocation).map(([channel, data], index) => (
                            <div key={channel} className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-sm bg-${["indigo", "cyan", "amber", "yellow"][index % 4]}-500`}></div>
                              <span className="text-sm">{channel}: {formatCurrency(data.suggested_investment)} ({data.current_share})</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-center text-gray-500">
                          Répartition recommandée du budget entre les différentes chaînes
                        </p>
                      </div>
                      <div>
                        <h4 className="mb-4 text-base font-medium">Heures optimales de diffusion</h4>
                        <BarChart
                          data={prepareTimeSlotData()}
                          index="timeSlot"
                          categories={["Nombre de chaînes"]}
                          colors={["indigo"]}
                          valueFormatter={(value) => `${value}`}
                          className="h-80"
                          showLegend={true}
                          legendPosition="center"
                        />
                      </div>
                    </div>
                    
                    <Divider className="my-8" />
                    
                    <div>
                      <h4 className="mb-4 text-base font-medium">Comparaison des coûts moyens par spot</h4>
                      <div className="h-80">
                        <BarChart
                          data={prepareCostComparisonData()}
                          index="channel"
                          categories={["cost"]}
                          colors={["indigo"]}
                          valueFormatter={formatCurrency}
                          layout="vertical"
                        />
                      </div>
                      <p className="mt-2 text-sm text-center text-gray-500">
                        Coût moyen par spot pour chaque chaîne
                      </p>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="channels">
                  <div>
                    <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-50">
                      Allocation par chaîne
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {Object.entries(results.recommendations.channel_allocation).map(([channel, data]) => (
                        <Card key={channel} className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-medium">{channel}</h4>
                              <Badge variant={getImpactColor(data.impact_level)} className="mt-1">
                                Impact {data.impact_level}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Part du budget</p>
                              <p className="text-lg font-semibold">{data.current_share}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="mb-4">
                              <p className="mb-1 text-sm font-medium">Investissement suggéré</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold">{formatCurrency(data.suggested_investment)}</span>
                                <ProgressBar 
                                  value={parseFloat(data.current_share.replace('%', ''))} 
                                  className="w-32" 
                                  variant={data.impact_level === "Elevé" ? "success" : data.impact_level === "Moyen" ? "warning" : "error"}
                                />
                              </div>
                            </div>
                            
                            <Divider />
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Spots estimés</p>
                                <p className="font-medium">{data.estimated_spots}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Durée moyenne</p>
                                <p className="font-medium">{data.avg_duration} sec</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Coût moyen par spot</p>
                                <p className="font-medium">{formatCurrency(data.avg_cost_per_spot)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Heures optimales</p>
                                <div className="flex flex-wrap gap-1">
                                  {data.optimal_time_slots.map((slot) => (
                                    // <Badge key={slot} variant="outline" className="mt-1">
                                    <Badge key={slot} variant="success" className="mt-1">
                                      {formatTimeSlot(slot)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="mt-8">
              <Card className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    Résultats de la simulation
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Remplissez le formulaire ci-dessus et lancez la simulation
                    pour voir les résultats.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

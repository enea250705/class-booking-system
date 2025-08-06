"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Calendar, User, CreditCard, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface PackageRenewal {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  package: {
    id: string
    name: string
    active: boolean
  }
  packageType: string
  packageName: string
  renewedAt: string
  startDate: string
  endDate: string
  price: number | null
  method: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const methodColors = {
  purchase: "bg-green-500/20 text-green-300 border-green-500/30",
  renewal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  admin_assigned: "bg-purple-500/20 text-purple-300 border-purple-500/30",
}

const methodLabels = {
  purchase: "New Purchase",
  renewal: "Renewal",
  admin_assigned: "Admin Assigned",
}

export default function AdminRenewalsPage() {
  const [renewals, setRenewals] = useState<PackageRenewal[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")
  const [filterMethod, setFilterMethod] = useState("all")
  const { toast } = useToast()

  const fetchRenewals = async (page = 1) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchEmail) {
        // Note: We'll need to modify the API to support email search
        params.append("email", searchEmail)
      }
      
      if (filterMethod !== "all") {
        params.append("method", filterMethod)
      }

      const response = await fetch(`/api/admin/renewals?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch renewals")
      }

      const data = await response.json()
      
      if (data.success) {
        setRenewals(data.renewals)
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || "Failed to fetch renewals")
      }
    } catch (error) {
      console.error("Error fetching renewals:", error)
      toast({
        title: "Error",
        description: "Failed to fetch renewal data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRenewals()
  }, [filterMethod])

  const handleSearch = () => {
    fetchRenewals(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—"
    return `€${amount}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Package Renewals</h1>
              <p className="text-white/60">Track all membership purchases and renewals</p>
            </div>
            <Button
              onClick={() => fetchRenewals(pagination.page)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Search by email
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="user@example.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="bg-black/30 border-white/10 text-white"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} size="sm">
                      Search
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Filter by type
                  </label>
                  <Select value={filterMethod} onValueChange={setFilterMethod}>
                    <SelectTrigger className="bg-black/30 border-white/10 text-white">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/80 backdrop-blur-lg border-white/10 text-white">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">New Purchases</SelectItem>
                      <SelectItem value="renewal">Renewals</SelectItem>
                      <SelectItem value="admin_assigned">Admin Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="text-white/60 text-sm">
                    {pagination.total} total renewals
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Renewals Table */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-white/60" />
                </div>
              ) : renewals.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">No renewals found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/40 border-b border-white/10">
                      <tr>
                        <th className="text-left py-4 px-6 text-white/80 font-medium">User</th>
                        <th className="text-left py-4 px-6 text-white/80 font-medium">Package</th>
                        <th className="text-left py-4 px-6 text-white/80 font-medium">Type</th>
                        <th className="text-left py-4 px-6 text-white/80 font-medium">Date</th>
                        <th className="text-left py-4 px-6 text-white/80 font-medium">Period</th>
                        <th className="text-right py-4 px-6 text-white/80 font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renewals.map((renewal) => (
                        <tr
                          key={renewal.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-white/10 rounded-full p-2">
                                <User className="h-4 w-4 text-white/70" />
                              </div>
                              <div>
                                <div className="text-white font-medium">{renewal.user.name}</div>
                                <div className="text-white/60 text-sm">{renewal.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="text-white font-medium">{renewal.packageType} Classes</div>
                              <div className="text-white/60 text-sm">{renewal.packageName}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge 
                              className={`${methodColors[renewal.method as keyof typeof methodColors]} font-medium`}
                            >
                              {methodLabels[renewal.method as keyof typeof methodLabels]}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white">{formatDate(renewal.renewedAt)}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white/80 text-sm">
                              {new Date(renewal.startDate).toLocaleDateString()} — {new Date(renewal.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <CreditCard className="h-4 w-4 text-white/40" />
                              <span className="text-white font-medium">{formatCurrency(renewal.price)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-white/60 text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} renewals
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchRenewals(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchRenewals(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Search, Users, Clock, MapPin, Calendar, UserPlus, Loader2, Mail, Send } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  remainingClasses: number
  expirationDate: string
  packageType: string
}

interface PreAddedUser {
  id: string
  name: string
  email: string
  avatar?: string
  addedAt: string
  notified: boolean
}

interface ClassDetails {
  id: string
  name: string
  date: string
  time: string
  location: string
  capacity: number
  enabled: boolean
  currentBookings: number
  preAddedCount: number
}

export default function AddUsersToClassPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [preAddedUsers, setPreAddedUsers] = useState<PreAddedUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingUsers, setAddingUsers] = useState<Set<string>>(new Set())
  const [sendingNotifications, setSendingNotifications] = useState<Set<string>>(new Set())
  const [sendEmailImmediately, setSendEmailImmediately] = useState(true)
  const [forceAddWithoutPackage, setForceAddWithoutPackage] = useState(false)

  useEffect(() => {
    fetchClassDetails()
    fetchUsers()
    fetchPreAddedUsers()
  }, [classId])

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const fetchClassDetails = async () => {
    try {
      const response = await fetch(`/api/admin/classes/${classId}`)
      if (response.ok) {
        const data = await response.json()
        setClassDetails(data)
      }
    } catch (error) {
      console.error('Error fetching class details:', error)
      toast.error('Failed to load class details')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?classId=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchPreAddedUsers = async () => {
    try {
      const response = await fetch(`/api/admin/classes/${classId}/pre-added-users`)
      if (response.ok) {
        const data = await response.json()
        setPreAddedUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching pre-added users:', error)
    }
  }

  const handleAddUser = async (userId: string) => {
    setAddingUsers(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch(`/api/admin/classes/${classId}/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          sendEmailImmediately: classDetails?.enabled ? sendEmailImmediately : false,
          forceAdd: forceAddWithoutPackage
        })
      })

      if (response.ok) {
        const result = await response.json()
        const user = users.find(u => u.id === userId)
        
        if (classDetails?.enabled) {
          toast.success(`${user?.name} added to class successfully!${sendEmailImmediately ? ' Email sent.' : ' No email sent.'}`)
        } else {
          toast.success(`${user?.name} pre-added to class successfully!${sendEmailImmediately ? ' Email sent.' : ' No email sent.'}`)
        }
        
        // Remove user from available list
        setUsers(prev => prev.filter(u => u.id !== userId))
        
        // Update class details
        if (classDetails) {
          setClassDetails(prev => prev ? {
            ...prev,
            currentBookings: classDetails.enabled ? prev.currentBookings + 1 : prev.currentBookings,
            preAddedCount: !classDetails.enabled ? prev.preAddedCount + 1 : prev.preAddedCount
          } : null)
        }

        // Refresh pre-added users if class is disabled
        if (!classDetails?.enabled) {
          fetchPreAddedUsers()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || error.message || 'Failed to add user to class')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error('Failed to add user to class')
    } finally {
      setAddingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleSendNotification = async (userId: string) => {
    setSendingNotifications(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch(`/api/admin/classes/${classId}/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const user = preAddedUsers.find(u => u.id === userId)
        toast.success(`Notification sent to ${user?.name}!`)
        
        // Update the user's notification status
        setPreAddedUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, notified: true } : u
        ))
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setSendingNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleSendAllNotifications = async () => {
    const unnotifiedUsers = preAddedUsers.filter(u => !u.notified)
    
    for (const user of unnotifiedUsers) {
      await handleSendNotification(user.id)
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/classes/${classId}`)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {classDetails?.enabled ? 'Add Users to Class' : 'Pre-add Users to Class'}
              </h1>
              <p className="text-white/70 mt-1">
                {classDetails?.enabled 
                  ? 'Select users to add to this enabled class'
                  : 'Pre-add users to this disabled class - they will be notified when enabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Class Info Card */}
        {classDetails && (
          <Card className="bg-gray-800/50 border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{classDetails.name}</span>
                <Badge variant={classDetails.enabled ? "default" : "secondary"}>
                  {classDetails.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white/80">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(classDetails.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{classDetails.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{classDetails.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {classDetails.currentBookings + classDetails.preAddedCount}/{classDetails.capacity}
                    {classDetails.preAddedCount > 0 && (
                      <span className="text-yellow-400 ml-1">
                        ({classDetails.preAddedCount} pre-added)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Options */}
        <Card className="bg-gray-800/50 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Add User Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="force-add-without-package"
                  checked={forceAddWithoutPackage}
                  onCheckedChange={setForceAddWithoutPackage}
                />
                <Label htmlFor="force-add-without-package" className="text-white">
                  Add without package requirement (pre-add / admin override)
                </Label>
              </div>
              <p className="text-white/60 text-sm">
                When enabled, you can add any user even if they don&apos;t have an active package or remaining classes.
              </p>
              <Separator className="bg-white/10" />
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-email-immediately"
                  checked={sendEmailImmediately}
                  onCheckedChange={setSendEmailImmediately}
                />
                <Label htmlFor="send-email-immediately" className="text-white">
                  Send email notifications immediately when adding users
                </Label>
              </div>
              <p className="text-white/60 text-sm">
                {classDetails?.enabled 
                  ? 'When enabled, users will receive booking confirmation emails immediately.'
                  : 'When enabled, users will receive pre-booking notification emails immediately.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pre-added Users Management (only show for disabled classes) */}
        {!classDetails?.enabled && preAddedUsers.length > 0 && (
          <Card className="bg-gray-800/50 border-white/10 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Pre-added Users ({preAddedUsers.length})</span>
                </CardTitle>
                {preAddedUsers.some(u => !u.notified) && (
                  <Button
                    onClick={handleSendAllNotifications}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Notify All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preAddedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-white/60 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.notified ? (
                        <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                          Notified
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleSendNotification(user.id)}
                          disabled={sendingNotifications.has(user.id)}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          {sendingNotifications.has(user.id) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Notify
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-white/10 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card className="bg-gray-800/50 border-white/10">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Available Users</h3>
              <p className="text-white/60">
                {searchTerm 
                  ? 'No users match your search criteria.'
                  : 'All eligible users have already been added to this class.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-gray-800/50 border-white/10 hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{user.name}</h3>
                      <p className="text-sm text-white/60 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Remaining Classes:</span>
                      <span className={`font-medium ${user.remainingClasses === 0 ? 'text-red-400' : 'text-white'}`}>
                        {user.remainingClasses}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Package:</span>
                      <span className={`font-medium ${user.packageType === 'No Active Package' ? 'text-yellow-400' : 'text-white'}`}>
                        {user.packageType}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Expires:</span>
                      <span className="text-white font-medium">
                        {user.packageType === 'No Active Package' 
                          ? 'N/A' 
                          : new Date(user.expirationDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAddUser(user.id)}
                    disabled={addingUsers.has(user.id)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {addingUsers.has(user.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {classDetails?.enabled ? 'Add User' : 'Pre-add User'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Trash2, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/notifications?unreadOnly=${showUnreadOnly}`)
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [showUnreadOnly])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, read: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
        
        toast({
          title: "Success",
          description: "Notification marked as read"
        })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        setUnreadCount(0)
        
        toast({
          title: "Success",
          description: "All notifications marked as read"
        })
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        
        toast({
          title: "Success",
          description: "Notification deleted"
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Class Cancellation Notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Track when clients cancel their class bookings
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {unreadCount} Unread
            </Badge>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            size="sm"
          >
            {showUnreadOnly ? "Show All" : "Unread Only"}
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              size="sm"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={fetchNotifications}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No notifications</p>
              <p className="text-sm mt-2">
                {showUnreadOnly 
                  ? "You have no unread notifications"
                  : "You'll see class cancellation notifications here"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={notification.read ? "opacity-60" : "border-l-4 border-l-primary"}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-base">{notification.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead([notification.id])}
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


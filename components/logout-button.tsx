'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  showIcon?: boolean
  label?: string
}

export function LogoutButton({ 
  className, 
  variant = 'ghost', 
  size = 'default',
  showIcon = true,
  label = 'Logout',
  ...props 
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { logout } = useAuth()
  const { toast } = useToast()

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    try {
      setIsLoggingOut(true)
      await logout()
      toast({
        variant: "success",
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      })
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again"
      })
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('font-medium transition-colors', className)}
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Logout from your account"
      {...props}
    >
      {isLoggingOut ? (
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
          <span>Logging out</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {showIcon && <LogOut className="h-4 w-4 flex-shrink-0" />}
          <span>{label}</span>
        </div>
      )}
    </Button>
  )
} 
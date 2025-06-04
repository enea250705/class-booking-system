import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Users, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function ClassCard({
  cls,
  isUpcoming = false,
  isBooking = false,
  isJoiningWaitlist = false,
  onBook,
  onCancel,
  onJoinWaitlist,
  userCanBook = true,
  waitlistPosition = null,
}: {
  cls: any;
  isUpcoming?: boolean;
  isBooking?: boolean;
  isJoiningWaitlist?: boolean;
  onBook?: (classId: string) => void;
  onCancel?: (bookingId: string) => void;
  onJoinWaitlist?: (classId: string) => void;
  userCanBook?: boolean;
  waitlistPosition?: number | null;
}) {
  const { toast } = useToast();
  const displayDate = new Date(cls.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Determine if class is full
  const isFull = cls.currentBookings >= cls.capacity;
  // Determine if user is on waitlist
  const isOnWaitlist = waitlistPosition !== null;

  return (
    <Card className="bg-black/60 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-white">{cls.name}</CardTitle>
        <CardDescription className="text-gray-300">
          {displayDate} • {cls.time}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 opacity-70" />
          <span>{cls.day}</span>
        </div>
        {cls.coach && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 opacity-70" />
            <span>{cls.coach}</span>
          </div>
        )}
        {!isUpcoming && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 opacity-70" />
            <span>
              {cls.currentBookings}/{cls.capacity} spots filled
            </span>
          </div>
        )}
        {isOnWaitlist && (
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="h-4 w-4" />
            <span>Waitlist position: #{waitlistPosition}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t border-white/10 pt-3 pb-3">
        {isUpcoming || cls.isBooked ? (
          <Button 
            onClick={() => onCancel && onCancel(cls.id)}
            className="w-full bg-transparent border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-white transition-colors"
            disabled={isBooking}
          >
            {isBooking ? (
              <span className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin"></div>
                <span>Cancelling...</span>
              </span>
            ) : (
              "Cancel Booking"
            )}
          </Button>
        ) : isOnWaitlist ? (
          // Show waitlist position if user is on waitlist
          <Button 
            className="w-full bg-amber-500/20 border border-amber-500/30 text-white hover:bg-amber-500/30 transition-colors"
            disabled={true}
          >
            On Waitlist (#{waitlistPosition})
          </Button>
        ) : isFull ? (
          // Show join waitlist button if class is full
          <Button 
            onClick={() => onJoinWaitlist && onJoinWaitlist(cls.id)}
            className="w-full bg-amber-500/20 border border-amber-500/30 text-white hover:bg-amber-500/30 transition-colors"
            disabled={isJoiningWaitlist || !userCanBook}
          >
            {isJoiningWaitlist ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                <span>Joining Waitlist...</span>
              </span>
            ) : (
              "Join Waitlist"
            )}
          </Button>
        ) : (
          // Normal booking button
          <Button 
            onClick={() => onBook && onBook(cls.id)}
            className="w-full bg-white hover:bg-white/90 text-black hover:text-black/90 disabled:bg-white/10 disabled:text-white/30 disabled:border disabled:border-white/10 transition-colors"
            disabled={
              !userCanBook || 
              cls.currentBookings >= cls.capacity ||
              isBooking
            }
          >
            {isBooking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                <span>Booking...</span>
              </span>
            ) : cls.currentBookings >= cls.capacity ? (
              "Class Full"
            ) : !userCanBook ? (
              "No Classes Remaining"
            ) : (
              "Book Class"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
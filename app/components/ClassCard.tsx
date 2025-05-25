import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Users } from "lucide-react";

export function ClassCard({
  cls,
  isUpcoming = false,
  isBooking = false,
  onBook,
  onCancel,
  userCanBook = true,
}: {
  cls: any;
  isUpcoming?: boolean;
  isBooking?: boolean;
  onBook?: (classId: string) => void;
  onCancel?: (bookingId: string) => void;
  userCanBook?: boolean;
}) {
  const displayDate = new Date(cls.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

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
        ) : (
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
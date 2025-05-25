# GymXam - Class Booking System

A modern class booking system built with Next.js, React, and Prisma, designed for fitness studios and boutique gyms.

## Features

- **User Authentication**: Secure login and registration system
- **Class Browsing**: View available classes with details
- **Booking Management**: Book, cancel, and view upcoming classes
- **User Dashboard**: Track class bookings and account status
- **Admin Dashboard**: Manage classes, users, and bookings
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React, Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT)
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/gymxam"

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (optional for notifications)
EMAIL_FROM="noreply@gymxam.com"
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gymxam.git
cd gymxam

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data (optional)
npx prisma db seed

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see the application running.

## Project Structure

```
/app                  # Next.js app directory
  /api                # API routes
  /admin              # Admin dashboard pages
  /dashboard          # User dashboard pages
  /classes            # Class browsing and details
  /bookings           # Booking management
  /login              # Authentication pages
/components           # Reusable React components
/lib                  # Utility functions and hooks
/prisma               # Database schema and migrations
/public               # Static assets
```

## License

This project is licensed under the MIT License.

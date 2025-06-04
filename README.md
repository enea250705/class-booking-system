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

## Deployment Instructions

### Vercel Deployment

1. Sign up or log in to Vercel: https://vercel.com/

2. Create a new project and import your GitHub repository
   - If you don't have a GitHub repository yet, create one and push your code:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/gymxam.git
   git push -u origin main
   ```

3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: prisma generate && next build
   - Install Command: npm install --legacy-peer-deps

4. Add Environment Variables:
   ```
   DATABASE_URL="postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"
   JWT_SECRET="3267f0bfd9af9164b84dfa5cc24a6bd4a92b696318cb4889c030c7de76ad00024f6cb68e6a6dbb1689de5d74f905b386c153adedd54b15cceb6771a4ec80283a"
   SMTP_HOST="authsmtp.securemail.pro"
   SMTP_PORT=465
   SMTP_USER="info@codewithenea.it"
   SMTP_PASS="Enea2507@"
   SMTP_FROM="GymXam <info@codewithenea.it>"
   NEXT_PUBLIC_VERCEL_ENV=production
   NEXT_PUBLIC_SKIP_BUILD_STATIC_GENERATION=true
   ```

5. Click "Deploy"

### Avoiding Static Generation Issues

The application uses dynamic rendering to ensure proper authentication flow. To avoid static generation errors:

1. **Use the GitHub-based deployment** instead of the CLI, as it provides better error reporting and more reliable deployments.

2. **All protected pages must include:**
   ```javascript
   "use client"
   export const dynamic = 'force-dynamic';
   ```

3. **Always initialize user data:**
   ```javascript
   const { user } = useAuth();
   ```
   
4. **Conditionally render components that depend on user data:**
   ```javascript
   {user && <UserDependentComponent user={user} />}
   ```

5. **Set environment variables** in Vercel project settings:
   - `NEXT_PUBLIC_VERCEL_ENV=production`
   - `NEXT_PUBLIC_SKIP_BUILD_STATIC_GENERATION=true`

6. **Check that middleware.ts** properly handles auth routes.

If you still encounter build errors, consider deploying from a specific GitHub branch that has these fixes.

### Admin Login

- Email: gymxam@gmail.com
- Password: xamilakis1992

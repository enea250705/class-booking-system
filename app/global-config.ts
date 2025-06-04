// Global configuration to ensure all pages use dynamic rendering in production
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0; // Disable static regeneration cache

// This file is imported by all pages that need dynamic rendering
// especially useful for Vercel deployments 
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Disable static generation
process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';

// Create a custom next.config.js with static generation disabled
const configPath = path.join(__dirname, 'next.config.mjs');
const configBackupPath = path.join(__dirname, 'next.config.backup.mjs');

// Backup original config
if (fs.existsSync(configPath)) {
  fs.copyFileSync(configPath, configBackupPath);
}

// Run build commands
try {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Building Next.js app...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} finally {
  // Restore original config
  if (fs.existsSync(configBackupPath)) {
    fs.copyFileSync(configBackupPath, configPath);
    fs.unlinkSync(configBackupPath);
  }
} 
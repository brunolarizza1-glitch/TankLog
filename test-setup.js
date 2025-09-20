#!/usr/bin/env node

// Simple test script to verify the project structure
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'components/AppShell.tsx',
  'lib/env.ts',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/stripe.ts',
  'lib/postmark.ts',
  'public/manifest.json',
  'public/logo.svg',
  'README.md',
];

console.log('🔍 Checking TankLog project structure...\n');

let allFilesExist = true;

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📁 Checking directories...');

const requiredDirs = [
  'app',
  'app/(auth)',
  'app/(auth)/signin',
  'app/auth',
  'app/auth/callback',
  'app/health',
  'components',
  'lib',
  'lib/supabase',
  'lib/pwa',
  'public',
  'public/icons',
  'styles',
  'server',
  '.vscode',
];

requiredDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n🎨 Checking branding...');

// Check if colors are defined in tailwind config
const tailwindConfig = fs.readFileSync(
  path.join(__dirname, 'tailwind.config.js'),
  'utf8'
);
if (tailwindConfig.includes('#1E63D5') && tailwindConfig.includes('#F6C341')) {
  console.log('✅ Brand colors configured');
} else {
  console.log('❌ Brand colors not found in Tailwind config');
  allFilesExist = false;
}

// Check if manifest has correct app name
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/manifest.json'), 'utf8')
);
if (manifest.name === 'TankLog' && manifest.short_name === 'TankLog') {
  console.log('✅ PWA manifest configured');
} else {
  console.log('❌ PWA manifest not properly configured');
  allFilesExist = false;
}

console.log('\n📋 Summary:');
if (allFilesExist) {
  console.log('🎉 TankLog project structure is complete!');
  console.log('\nNext steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Copy env.example to .env.local and fill in your values');
  console.log('3. Run: npm run dev');
  console.log('4. Open: http://localhost:3000');
} else {
  console.log(
    '❌ Some files or directories are missing. Please check the output above.'
  );
  process.exit(1);
}

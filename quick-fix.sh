#!/bin/bash

echo "🔧 Quick fix for TankLog..."

# Replace auth file with simplified version
echo "📝 Replacing auth context..."
cp lib/auth-simple.tsx lib/auth.tsx

# Clean up
rm -f lib/auth-simple.tsx

# Kill existing server
echo "🛑 Stopping server..."
pkill -f "npm run dev" || true
sleep 2

# Start server
echo "🚀 Starting server..."
npm run dev

echo "✅ Quick fix applied! Check http://localhost:3000"




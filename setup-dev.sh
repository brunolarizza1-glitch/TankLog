#!/bin/bash

echo "🚀 Setting up TankLog development environment..."

# Copy environment file
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ Created .env.local from env.example"
else
    echo "⚠️  .env.local already exists"
fi

# Update .env.local with development values
cat > .env.local << 'EOF'
# Supabase (placeholder values for development)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_anon_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_role_key

# Stripe (placeholder values for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Postmark (placeholder values for development)
POSTMARK_API_TOKEN=placeholder_postmark_token

# App
APP_URL=http://localhost:3000
PDF_SIGNING_SECRET=dev_signing_secret_12345
EOF

echo "✅ Updated .env.local with development values"

echo ""
echo "📋 Next steps:"
echo "1. Install Node.js (if not already installed)"
echo "2. Run: npm install"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "🔧 To use real services, update .env.local with your actual API keys:"
echo "   - Supabase: Get from https://supabase.com/dashboard"
echo "   - Stripe: Get from https://dashboard.stripe.com/apikeys"
echo "   - Postmark: Get from https://account.postmarkapp.com/api_tokens"

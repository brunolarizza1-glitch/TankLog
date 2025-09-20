# TankLog

A modern Next.js application for tank logging with Supabase integration, PDF generation, and PWA support.

## Features

- 🚛 **Tank Logging**: Create and manage tank logs with photos and compliance data
- 🔐 **Authentication**: Secure authentication with Supabase Auth (Google OAuth + Magic Links)
- 📄 **PDF Generation**: Generate professional PDF reports from tank logs
- 📱 **PWA Support**: Progressive Web App with offline capabilities
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 🔒 **Compliance Mode**: Special compliance features for regulated industries
- 📧 **Email Integration**: Send PDF reports via Postmark
- 💳 **Payment Processing**: Stripe integration for premium features

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: Puppeteer + React PDF
- **Email**: Postmark
- **Payments**: Stripe
- **Deployment**: Vercel-ready

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Console account (for OAuth)
- Postmark account (for email)
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/brunolarizza1-glitch/TankLog.git
   cd TankLog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Then edit `.env.local` with your actual credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Postmark
   POSTMARK_API_TOKEN=your_postmark_api_token

   # App
   APP_URL=http://localhost:3000
   PDF_SIGNING_SECRET=your_random_signing_secret
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` in order
   - Enable Google OAuth in Supabase Auth settings
   - Add your Google OAuth credentials

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and keys
3. Run the database migrations:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
6. Add the credentials to your `.env.local`

### Postmark Setup

1. Create account at [postmarkapp.com](https://postmarkapp.com)
2. Create a new server
3. Get your API token from Server API Tokens
4. Add to your `.env.local`

### Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Set up webhooks for your domain
4. Add credentials to your `.env.local`

## Database Schema

The application uses the following main tables:

- `organizations` - Company/organization data
- `users` - User profiles and settings
- `logs` - Tank log entries
- `log_photos` - Photos associated with logs
- `compliance_modes` - Compliance configuration

See `supabase/migrations/` for the complete schema.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── logs/              # Log management pages
│   └── settings/          # Settings pages
├── components/            # React components
├── lib/                   # Utility libraries
├── public/                # Static assets
├── server/                # Server-side utilities
├── supabase/              # Database migrations
└── styles/                # Global styles
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@tanklog.com or create an issue on GitHub.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API for third-party integrations
- [ ] Advanced compliance reporting
- [ ] Real-time notifications

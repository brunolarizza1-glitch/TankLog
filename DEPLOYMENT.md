# TankLog Deployment Guide for tanklog.co

This guide will help you deploy TankLog to your domain `tanklog.co`.

## Prerequisites

- Domain: `tanklog.co` (already owned)
- Supabase project configured
- Google OAuth credentials
- Stripe account (optional)
- Postmark account (optional)

## 1. Supabase Configuration

### Update Supabase Auth Settings

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to Authentication > URL Configuration
3. Update the following settings:

**Site URL:**
```
https://tanklog.co
```

**Redirect URLs:**
```
https://tanklog.co
https://tanklog.co/auth/callback
http://localhost:3000 (for development)
```

### Update Google OAuth Provider

1. In Supabase, go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set the redirect URL to: `https://tanklog.co/auth/callback`

## 2. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://tanklog.co/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## 3. Environment Variables for Production

Set these environment variables in your deployment platform:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ztfjmgnjypcaubuvqdsg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmptZ25qeXBjYXVidXZxZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NzUzODYsImV4cCI6MjA3MzU1MTM4Nn0.amFgv0aFWubRgDTrw9YbkuZjVLJRnux7kh7I9So0sjY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmptZ25qeXBjYXVidXZxZHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3NTM4NiwiZXhwIjoyMDczNTUxMzg2fQ.hOz0xeaGpvzS8b-BU9IGJPcvgaL9y6VnU7ACAlmRzS8

# Stripe (Update with your production keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Postmark
POSTMARK_API_TOKEN=72dc08f3-a44f-474f-bfe4-c655e6bd5be9

# App
APP_URL=https://tanklog.co
PDF_SIGNING_SECRET=your_secure_random_signing_secret
```

## 4. Deployment Options

### Option A: Vercel (Recommended)

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set the domain to `tanklog.co`

2. **Configure Environment Variables:**
   - Add all environment variables from step 3
   - Set `APP_URL` to `https://tanklog.co`

3. **Deploy:**
   - Vercel will automatically deploy on every push to main
   - Your app will be available at `https://tanklog.co`

### Option B: Netlify

1. **Connect Repository:**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Configure Environment Variables:**
   - Add all environment variables from step 3

3. **Custom Domain:**
   - Add `tanklog.co` as a custom domain
   - Configure DNS settings

### Option C: Railway

1. **Deploy:**
   - Connect your GitHub repository
   - Railway will automatically detect Next.js
   - Add environment variables from step 3

2. **Custom Domain:**
   - Add `tanklog.co` as a custom domain
   - Configure DNS settings

## 5. DNS Configuration

### For Vercel:
1. Add a CNAME record:
   - Name: `@` or `tanklog.co`
   - Value: `cname.vercel-dns.com`

### For Netlify:
1. Add a CNAME record:
   - Name: `@` or `tanklog.co`
   - Value: `your-app-name.netlify.app`

### For Railway:
1. Add a CNAME record:
   - Name: `@` or `tanklog.co`
   - Value: `your-app-name.railway.app`

## 6. SSL Certificate

Most deployment platforms automatically provide SSL certificates. Ensure your domain has HTTPS enabled.

## 7. Testing

After deployment, test the following:

1. **Basic functionality:**
   - Visit `https://tanklog.co`
   - Test user registration/login
   - Test Google OAuth flow

2. **Authentication:**
   - Test sign up with email
   - Test Google OAuth login
   - Test password reset flow

3. **Core features:**
   - Create a tank log
   - Upload photos
   - Generate PDF reports
   - Test email functionality

## 8. Monitoring

Set up monitoring for:
- Application uptime
- Error tracking (Sentry, LogRocket)
- Performance monitoring
- User analytics

## 9. Backup Strategy

- Database backups (Supabase handles this)
- Code backups (GitHub)
- Environment variable backups (store securely)

## Troubleshooting

### Common Issues:

1. **OAuth redirect errors:**
   - Verify redirect URLs in Google Cloud Console
   - Check Supabase auth configuration

2. **Environment variable issues:**
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Domain not resolving:**
   - Check DNS propagation
   - Verify CNAME records

4. **SSL certificate issues:**
   - Wait for certificate provisioning
   - Check domain configuration

## Support

If you encounter issues:
1. Check the deployment platform logs
2. Verify all environment variables
3. Test locally with production environment
4. Check Supabase logs for auth issues

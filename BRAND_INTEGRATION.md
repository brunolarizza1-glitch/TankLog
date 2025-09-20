# TankLog Brand Integration

## Acceptance Checklist

### ✅ Brand Assets Integration

- [x] Header wordmark pixel-perfect (no blur, no tint)
- [x] PWA install shows the exact provided icons (check Android maskable too)
- [x] PDF header uses the same logo asset as the app
- [x] No `<Image>` from next/image used on brand files
- [x] Colors on screen match #114FB3 (blue) and #F6C341 (accent)

### ✅ Brand Tokens

- [x] `brand.blue: #114FB3` - primary blue from logo
- [x] `brand.accent: #F6C341` - yellow outline
- [x] `brand.dark: #0F172A` - text (slate-like)
- [x] `brand.light: #FFFFFF` - white

### ✅ Global CSS Utilities

- [x] `.brand-img` - object-fit: contain; image-rendering: -webkit-optimize-contrast
- [x] `.btn-primary` - uses bg-brand-blue, hover:brightness-95, focus:ring-brand-blue
- [x] `.btn-secondary` - border-slate-300 text-brand-blue hover:bg-slate-50

### ✅ App Header (AppShell.tsx)

- [x] Shows color wordmark: `/brand/logo-horizontal.jpeg`
- [x] Fallback to `/brand/logo-horizontal-transparent.jpeg`
- [x] Max-height: 32px mobile, 48px desktop
- [x] Uses `.brand-img` class for proper scaling

### ✅ PWA Manifest (manifest.json)

- [x] "name": "TankLog"
- [x] "short_name": "TankLog"
- [x] "theme_color": "#114FB3"
- [x] "background_color": "#FFFFFF"
- [x] Icons use provided assets:
  - `/brand/icon.jpeg` (512x512, any)
  - `/brand/icon-transparent.jpeg` (512x512, any)
  - `/brand/icon-mask.png` (512x512, maskable)
  - `/brand/icon-original.jpeg` (192x192, any)

### ✅ Favicon (app/layout.tsx)

- [x] Links to `/brand/icon-original.jpeg`
- [x] Apple touch icon uses same asset
- [x] Theme color updated to #114FB3

### ✅ Next.js Config

- [x] `images.unoptimized = true`
- [x] Comment: "Brand assets under /public/brand must not use next/image"

### ✅ PDF Logo (server/pdf/generateLogPdfPuppeteer.ts)

- [x] Loads `/public/brand/logo-horizontal.jpeg` for PDF header
- [x] Embed at natural aspect ratio, width ~96–120px at 1x
- [x] Uses `file://${process.cwd()}/public/brand/...` for server path resolution

### ✅ Home & Sign-in Polish

- [x] Home hero: white background, brand.blue headings
- [x] Subtle brand.accent underline on CTA hover
- [x] Primary buttons: bg-brand-blue text-white
- [x] Secondary buttons: border-slate-300 text-brand-blue hover:bg-slate-50
- [x] Sign-in page: displays small `/brand/logo-horizontal.jpeg` above buttons

## Brand Asset Usage

### Logo Files

- `/public/brand/logo-horizontal.jpeg` - Primary horizontal logo
- `/public/brand/logo-horizontal-transparent.jpeg` - Fallback transparent version
- `/public/brand/logo-horizontal-bw.jpeg` - Dark mode version (future use)
- `/public/brand/logo-square.jpeg` - Square logo variant
- `/public/brand/logo-square-transparent.jpeg` - Square transparent version

### Icon Files

- `/public/brand/icon.jpeg` - Primary 512x512 icon
- `/public/brand/icon-transparent.jpeg` - Transparent 512x512 icon
- `/public/brand/icon-mask.png` - Maskable 512x512 icon for Android
- `/public/brand/icon-original.jpeg` - 192x192 icon for favicon
- `/public/brand/icon-mask.png` - Mask icon for PWA

## Implementation Notes

1. **No next/image usage** - All brand assets use standard `<img>` tags with `.brand-img` class
2. **Pixel-perfect rendering** - Assets are used as-is without re-encoding or color shifts
3. **Proper fallbacks** - Transparent versions used as fallbacks for logos
4. **Consistent theming** - All UI elements use brand tokens for consistent colors
5. **PWA compliance** - Manifest properly configured with all required icon sizes and purposes

## Commit

```
feat(brand): integrate TankLog assets exactly; set brand tokens; wire manifest/header/PDF
```

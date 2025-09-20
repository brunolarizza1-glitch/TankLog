# Brand Assets Directory

Place the following TankLog brand assets in this directory:

## Required Files

- `icon-mask.png` - Maskable icon for Android PWA
- `icon-original.jpeg` - 192x192 icon for favicon
- `icon-transparent.jpeg` - 512x512 transparent icon
- `icon.jpeg` - 512x512 primary icon
- `logo-horizontal-bw.jpeg` - Black and white horizontal logo
- `logo-horizontal-transparent-bw.jpeg` - Black and white transparent horizontal logo
- `logo-horizontal-transparent.jpeg` - Transparent horizontal logo
- `logo-horizontal.jpeg` - Primary horizontal logo
- `logo-square-bw.jpeg` - Black and white square logo
- `logo-square-transparent-bw.jpeg` - Black and white transparent square logo

## Usage

These assets are used throughout the application:

- Header logo: `logo-horizontal.jpeg` (with transparent fallback)
- PWA icons: All icon files for different purposes and sizes
- PDF header: `logo-horizontal.jpeg`
- Favicon: `icon-original.jpeg`

## Important

- Do NOT use next/image for these assets
- Use standard `<img>` tags with `brand-img` class
- Assets are used as-is without re-encoding or color shifts





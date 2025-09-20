# TankLog Design System

A comprehensive design system for the TankLog propane compliance application, built with consistency, accessibility, and mobile-first principles.

## 🎨 Color Palette

### Primary Colors

- **Primary Blue**: `#1e40af` - Main brand color for primary actions
- **Accent Gold**: `#f59e0b` - Secondary brand color for highlights
- **Success Green**: `#059669` - Success states and positive actions
- **Warning Amber**: `#d97706` - Warning states and caution
- **Danger Red**: `#dc2626` - Error states and critical actions

### Neutral Colors

- **Gray 50**: `#f8fafc` - Light backgrounds
- **Gray 200**: `#e2e8f0` - Borders and dividers
- **Gray 500**: `#64748b` - Secondary text
- **Gray 700**: `#334155` - Primary text

## 📝 Typography

### Font Family

- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, sans-serif

### Font Scale

- **Heading 1**: 32px / 1.2 line height / Bold
- **Heading 2**: 24px / 1.2 line height / Semibold
- **Heading 3**: 20px / 1.2 line height / Semibold
- **Heading 4**: 18px / 1.2 line height / Medium
- **Heading 5**: 16px / 1.2 line height / Medium
- **Heading 6**: 14px / 1.2 line height / Medium
- **Body**: 16px / 1.5 line height / Normal

### Font Weights

- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## 📏 Spacing Scale

Based on 4px grid system:

- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **6**: 24px
- **8**: 32px
- **12**: 48px

## 🔲 Border Radius

- **Small**: 4px (inputs, badges)
- **Medium**: 6px (buttons)
- **Large**: 8px (cards, modals)

## 🌟 Shadows

- **Small**: `0 1px 2px rgba(0, 0, 0, 0.06)`
- **Medium**: `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)`

## 🎯 Component Heights

### Mobile (default)

- **Button**: 44px
- **Input**: 48px

### Desktop (768px+)

- **Button**: 40px
- **Input**: 44px

## 🧩 Component Classes

### Buttons

```css
.btn                    /* Base button class */
.btn-primary           /* Primary blue button */
.btn-accent            /* Accent gold button */
.btn-success           /* Success green button */
.btn-warning           /* Warning amber button */
.btn-danger            /* Danger red button */
.btn-outline           /* Outline button */
.btn-ghost             /* Ghost button */

.btn-sm                /* Small button (40px) */
.btn-md                /* Medium button (44px mobile, 40px desktop) */
.btn-lg                /* Large button (44px mobile, 40px desktop) */
```

### Inputs

```css
.input                 /* Base input class */
.input-sm              /* Small input (44px) */
.input-md              /* Medium input (48px mobile, 44px desktop) */
.input-lg              /* Large input (48px mobile, 44px desktop) */
```

### Cards

```css
.card                  /* Base card class */
.card-header           /* Card header */
.card-body             /* Card body */
.card-footer           /* Card footer */
```

### Alerts

```css
.alert                 /* Base alert class */
.alert-success         /* Success alert */
.alert-warning         /* Warning alert */
.alert-danger          /* Danger alert */
.alert-info            /* Info alert */
```

### Badges

```css
.badge                 /* Base badge class */
.badge-primary         /* Primary badge */
.badge-accent          /* Accent badge */
.badge-success         /* Success badge */
.badge-warning         /* Warning badge */
.badge-danger          /* Danger badge */
.badge-gray            /* Gray badge */
```

## 📱 Responsive Design

### Breakpoints

- **Mobile**: Default (0px+)
- **Desktop**: 768px+

### Responsive Classes

- `.mobile-hidden` - Hidden on mobile
- `.desktop-hidden` - Hidden on desktop

## 🎨 Utility Classes

### Typography

- `.text-xs`, `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl`, `.text-3xl`
- `.font-normal`, `.font-medium`, `.font-semibold`, `.font-bold`
- `.heading-1` through `.heading-6`

### Colors

- `.text-primary`, `.text-accent`, `.text-success`, `.text-warning`, `.text-danger`
- `.bg-primary`, `.bg-accent`, `.bg-success`, `.bg-warning`, `.bg-danger`
- `.border-primary`, `.border-accent`, `.border-success`, `.border-warning`, `.border-danger`

### Spacing

- `.p-1` through `.p-12` (padding)
- `.px-1` through `.px-8` (horizontal padding)
- `.py-1` through `.py-8` (vertical padding)
- `.m-1` through `.m-12` (margin)
- `.mx-1` through `.mx-8` (horizontal margin)
- `.my-1` through `.my-8` (vertical margin)

### Layout

- `.flex`, `.flex-col`, `.flex-row`
- `.items-center`, `.items-start`, `.items-end`
- `.justify-center`, `.justify-start`, `.justify-end`, `.justify-between`
- `.w-full`, `.h-full`

## 🚀 Usage Examples

### Button

```jsx
import { Button } from '@/components/design-system';

<Button variant="primary" size="md">
  Create Action
</Button>;
```

### Input

```jsx
import { Input } from '@/components/design-system';

<Input
  label="Email Address"
  placeholder="Enter your email"
  error="Email is required"
  size="md"
/>;
```

### Card

```jsx
import { Card } from '@/components/design-system';

<Card header={<h3>Card Title</h3>} footer={<Button>Action</Button>}>
  <p>Card content goes here</p>
</Card>;
```

### Alert

```jsx
import { Alert } from '@/components/design-system';

<Alert type="success" onClose={() => setShow(false)}>
  Action completed successfully!
</Alert>;
```

### Badge

```jsx
import { Badge } from '@/components/design-system';

<Badge variant="success">Completed</Badge>;
```

## 🎯 CSS Custom Properties

All design tokens are available as CSS custom properties:

```css
:root {
  --primary-blue: #1e40af;
  --accent-gold: #f59e0b;
  --success-green: #059669;
  --warning-amber: #d97706;
  --danger-red: #dc2626;
  --gray-50: #f8fafc;
  --gray-200: #e2e8f0;
  --gray-500: #64748b;
  --gray-700: #334155;

  --font-family: 'Inter', system-ui, sans-serif;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}
```

## 🔧 Implementation

The design system is implemented in:

- `/styles/design-system.css` - Core CSS with custom properties and utility classes
- `/components/design-system/` - React components using the design system
- `/app/globals.css` - Imports the design system
- `/tailwind.config.js` - Tailwind configuration with design system colors

## 📋 Best Practices

1. **Use design system classes** instead of custom CSS when possible
2. **Follow the spacing scale** for consistent layouts
3. **Use semantic color names** (success, warning, danger) instead of specific colors
4. **Test on mobile first** - all components are mobile-optimized
5. **Maintain consistency** - use the same patterns across the application
6. **Accessibility first** - all components include proper focus states and ARIA attributes

## 🎨 Design Tokens

All design tokens are centralized in the CSS custom properties, making it easy to:

- Update colors globally
- Maintain consistency
- Support theming
- Scale the design system

This design system ensures TankLog has a cohesive, professional, and accessible user interface that works seamlessly across all devices and use cases.

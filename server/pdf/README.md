# TankLog PDF Generation System

This module handles the generation of professional PDF reports for TankLog entries.

## Overview

The PDF generation system creates branded, compliance-specific PDFs for each log entry with the following features:

- **Compliance Mode Support**: Different layouts and requirements for US_NFPA58 vs CA_TSSA
- **Photo Integration**: Up to 5 photos per log with thumbnail display
- **Branded Headers**: Organization logo or TankLog wordmark
- **Data Integrity**: SHA256 hash for tamper detection
- **Responsive Layout**: Two-column design that works on Letter and A4 paper

## Files

- `generateLogPdf.ts` - Main PDF generation logic
- `templates/log.html` - HTML template for PDF layout
- `index.ts` - Module exports

## Usage

```typescript
import { generateLogPdf } from '@/server/pdf/generateLogPdf';

// Generate PDF for a log
const result = await generateLogPdf(logId);
console.log('PDF URL:', result.pdfUrl);
console.log('Filename:', result.filename);
```

## PDF Layout

### Header

- Left: Organization logo (64-96px) or "TankLog" text
- Right: Compliance-specific title and metadata
- Subheader: Organization name, date, and log ID

### Body (Two-column layout)

- **Occurred At**: Local timestamp with timezone
- **Site/Facility**: Location information
- **Vehicle/Bobtail ID**: (US mode only)
- **Tank/Cylinder ID**: Required identifier
- **Pressure**: With unit hint (psi/kPa)
- **Leak Check**: Pass/Fail with visual indicators
- **Visual Inspection**: All OK/Issues (US required, CA optional)
- **Operator**: Name, email, and initials
- **Notes**: Multiline text with proper wrapping
- **Corrective Action**: Highlighted section for issues

### Photos

- Grid layout with up to 5 photos
- 2-3 photos per row
- Auto-scaling with aspect ratio preservation
- Fallback for failed photo loads

### Footer

- Generated timestamp
- Compliance mode
- Integrity hash for tamper detection

## File Naming Convention

```
{orgSlug}_{siteSlug}_{YYYY-MM-DD}_Tank-{TANKID}_v{version}.pdf
```

Example: `acme-corp_main-facility_2024-01-15_Tank-ABC123_v1.pdf`

## Storage

- **Bucket**: `log-pdfs`
- **Path**: `/{org_id}/{YYYY}/{MM}/{filename}`
- **Access**: Private with signed URLs (30-day expiry)
- **Size Limit**: 10MB per file

## Compliance Modes

### US_NFPA58

- Title: "Daily LP-Gas Operational Log — NFPA 58"
- Pressure unit: psi
- Visual Inspection: Required
- Site OR Vehicle ID: Required

### CA_TSSA

- Title: "Daily Propane Operational Log — CSA B149 / Provincial"
- Pressure unit: kPa
- Visual Inspection: Optional
- Site: Required

## Error Handling

The system includes comprehensive error handling:

- **LOG_NOT_FOUND**: Log doesn't exist or access denied
- **STORAGE_ERROR**: Failed to save PDF to Supabase Storage
- **URL_GENERATION_ERROR**: Failed to create signed URL
- **PDF_GENERATION_FAILED**: General PDF generation error

## Security

- RLS policies ensure only organization members can access PDFs
- Signed URLs with 30-day expiration
- Integrity hashes prevent tampering
- Private storage bucket

## Performance

- Asynchronous PDF generation (non-blocking)
- Client-side photo compression before upload
- Efficient HTML template rendering
- Cached signed URLs

## Testing

Use the test endpoint to generate PDFs:

```bash
GET /api/test/pdf?logId={logId}
```

This will generate a PDF and return the URL for immediate viewing.

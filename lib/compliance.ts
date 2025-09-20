// Compliance mode types and utilities for TankLog

export type ComplianceMode = 'US_NFPA58' | 'CA_TSSA';

export interface ComplianceModeInfo {
  mode: ComplianceMode;
  title: string;
  description: string;
  requirements: {
    siteRequired: boolean;
    vehicleIdRequired: boolean;
    pressureRequired: boolean;
    visualInspectionRequired: boolean;
    leakCheckRequired: boolean;
  };
  labels: {
    pressureUnit: string;
    pressureHint: string;
    visualInspectionLabel: string;
    formTitle: string;
  };
  pdfFooter: string;
}

export const COMPLIANCE_MODES: Record<ComplianceMode, ComplianceModeInfo> = {
  US_NFPA58: {
    mode: 'US_NFPA58',
    title: 'United States – NFPA 58',
    description:
      'Requires Site/Facility or Vehicle ID, Leak Check, Visual Inspection emphasis; retention guidance refers to NFPA 58/DOT.',
    requirements: {
      siteRequired: false, // Either site OR vehicle ID required
      vehicleIdRequired: false, // Either site OR vehicle ID required
      pressureRequired: false,
      visualInspectionRequired: true,
      leakCheckRequired: true,
    },
    labels: {
      pressureUnit: 'psi',
      pressureHint: 'psi (enter as measured)',
      visualInspectionLabel: 'Visual Inspection (All OK / Issues)',
      formTitle: 'Daily LP-Gas Operational Log — NFPA 58',
    },
    pdfFooter:
      'Guidance: retain operational records per NFPA 58 and applicable state/DOT rules.',
  },
  CA_TSSA: {
    mode: 'CA_TSSA',
    title: 'Canada – CSA B149 / Provincial (TSSA)',
    description:
      'Requires Site, Pressure (kPa hint), Leak Check; retention guidance ≥ 2 years (provincial authorities).',
    requirements: {
      siteRequired: true,
      vehicleIdRequired: false,
      pressureRequired: false, // Encouraged but not required
      visualInspectionRequired: false,
      leakCheckRequired: true,
    },
    labels: {
      pressureUnit: 'kPa',
      pressureHint: 'kPa (enter as measured)',
      visualInspectionLabel: 'Visual Inspection (Optional)',
      formTitle: 'Daily Propane Operational Log — CSA B149 / Provincial',
    },
    pdfFooter:
      'Guidance: retain records ≥ 2 years or per provincial authority (e.g., TSSA).',
  },
};

export function getComplianceModeInfo(
  mode: ComplianceMode
): ComplianceModeInfo {
  return COMPLIANCE_MODES[mode];
}

export function validateLogData(
  data: Record<string, unknown>,
  complianceMode: ComplianceMode
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Common required fields
  if (!data.tank_id || typeof data.tank_id !== 'string' || !data.tank_id.trim()) {
    errors.push('Tank/Cylinder ID is required');
  }

  if (data.leak_check === undefined || data.leak_check === null) {
    errors.push('Leak Check result is required');
  }

  if (
    !data.initials ||
    typeof data.initials !== 'string' ||
    !data.initials.trim() ||
    data.initials.length < 2 ||
    data.initials.length > 3
  ) {
    errors.push('Initials must be 2-3 characters');
  }

  // Mode-specific validation
  if (complianceMode === 'US_NFPA58') {
    // Either site OR vehicle ID required
    if (
      (!data.site || typeof data.site !== 'string' || !data.site.trim()) &&
      (!data.vehicle_id || typeof data.vehicle_id !== 'string' || !data.vehicle_id.trim())
    ) {
      errors.push(
        'Either Site or Vehicle ID is required for US NFPA 58 compliance'
      );
    }

    // Visual inspection required
    if (data.visual_ok === undefined || data.visual_ok === null) {
      errors.push(
        'Visual Inspection result is required for US NFPA 58 compliance'
      );
    }
  } else if (complianceMode === 'CA_TSSA') {
    // Site required
    if (!data.site || typeof data.site !== 'string' || !data.site.trim()) {
      errors.push('Site is required for Canadian TSSA compliance');
    }
  }

  // Corrective action required if there are issues
  if (
    (data.leak_check === false || data.visual_ok === false) &&
    (!data.corrective_action || typeof data.corrective_action !== 'string' || !data.corrective_action.trim())
  ) {
    errors.push(
      'Corrective Action is required when Leak Check fails or Visual Inspection indicates issues'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

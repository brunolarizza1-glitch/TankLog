'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { ComplianceMode, getComplianceModeInfo } from '@/lib/compliance';

export function useComplianceMode() {
  const { profile } = useAuth();
  const [complianceMode, setComplianceMode] = useState<ComplianceMode>('US_NFPA58');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplianceMode = async () => {
      if (!profile?.org_id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizations/${profile.org_id}/compliance-mode`);
        if (response.ok) {
          const data = await response.json();
          setComplianceMode(data.compliance_mode || 'US_NFPA58');
        }
      } catch (error) {
        console.error('Error fetching compliance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceMode();
  }, [profile?.org_id]);

  const complianceInfo = getComplianceModeInfo(complianceMode);

  return {
    complianceMode,
    complianceInfo,
    loading,
  };
}

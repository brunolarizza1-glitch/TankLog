import { createAdminClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/errors';

// Database types
export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  owner_id: string;
  compliance_mode: 'US_NFPA58' | 'CA_TSSA';
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
  org_id?: string;
  role: 'admin' | 'worker';
  created_at: string;
}

export interface Log {
  id: string;
  root_id: string;
  version: number;
  org_id: string;
  user_id: string;
  compliance_mode: 'US_NFPA58' | 'CA_TSSA';
  occurred_at: string;
  site: string;
  vehicle_id?: string;
  tank_id: string;
  pressure?: string;
  leak_check: boolean;
  visual_ok?: boolean;
  notes?: string;
  corrective_action?: string;
  photo_urls: string[];
  pdf_url?: string;
  email_message_id?: string;
  signature?: string;
  has_failures?: boolean;
  created_at: string;
}

export interface LogWithUser extends Log {
  user: Pick<Profile, 'id' | 'name' | 'email'>;
}

export interface LogWithOrg extends Log {
  organization: Pick<Organization, 'id' | 'name' | 'compliance_mode'>;
}

// Database helper class
export class Database {
  private supabase = createAdminClient();

  // Organization methods
  async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      // Handle mock client in development
      if (!this.supabase.from) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new DatabaseError(
          `Failed to fetch organization: ${error.message}`,
          { error }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching organization', {
        error,
      });
    }
  }

  async createOrganization(
    org: Omit<Organization, 'id' | 'created_at'>
  ): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .insert(org)
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }

    return data;
  }

  async updateOrganization(
    orgId: string,
    updates: Partial<Omit<Organization, 'id' | 'created_at'>>
  ): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return null;
    }

    return data;
  }

  async getOrganizationComplianceMode(orgId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('compliance_mode')
      .eq('id', orgId)
      .single();

    if (error) {
      console.error('Error fetching organization compliance mode:', error);
      return null;
    }

    return data?.compliance_mode || 'US_NFPA58';
  }

  // Profile methods
  async getProfile(userId: string): Promise<Profile | null> {
    // Handle mock client in development
    if (!this.supabase.from) {
      console.warn(
        'Database not configured. Returning null profile for development.'
      );
      return null;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  async createProfile(
    profile: Omit<Profile, 'created_at'>
  ): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  }

  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  }

  async getOrgProfiles(orgId: string): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      console.error('Error fetching org profiles:', error);
      return [];
    }

    return data || [];
  }

  // Log methods
  async createLog(log: Omit<Log, 'id' | 'created_at'>): Promise<Log | null> {
    const { data, error } = await this.supabase
      .from('logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('Error creating log:', error);

      // If signature column doesn't exist, try without it
      if (error.code === 'PGRST204' && error.message.includes('signature')) {
        console.log(
          'Signature column not found, creating log without signature'
        );
        const { signature, ...logWithoutSignature } = log;

        const { data: retryData, error: retryError } = await this.supabase
          .from('logs')
          .insert(logWithoutSignature)
          .select()
          .single();

        if (retryError) {
          console.error('Error creating log without signature:', retryError);
          return null;
        }

        return retryData;
      }

      return null;
    }

    return data;
  }

  async getLog(logId: string): Promise<Log | null> {
    const { data, error } = await this.supabase
      .from('logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (error) {
      console.error('Error fetching log:', error);
      return null;
    }

    return data;
  }

  async getLogWithUser(logId: string): Promise<LogWithUser | null> {
    const { data, error } = await this.supabase
      .from('logs')
      .select(
        `
        *,
        user:profiles!logs_user_id_fkey(id, name, email)
      `
      )
      .eq('id', logId)
      .single();

    if (error) {
      console.error('Error fetching log with user:', error);
      return null;
    }

    return data;
  }

  async getLogsByOrg(orgId: string, limit = 50, offset = 0): Promise<Log[]> {
    const { data, error } = await this.supabase
      .from('logs')
      .select('*')
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching org logs:', error);
      return [];
    }

    return data || [];
  }

  async getLogs(orgId: string): Promise<Log[]> {
    return this.getLogsByOrg(orgId);
  }

  async getLogsByUser(userId: string, limit = 50, offset = 0): Promise<Log[]> {
    const { data, error } = await this.supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }

    return data || [];
  }

  async getLogVersions(rootId: string): Promise<Log[]> {
    const { data, error } = await this.supabase
      .from('logs')
      .select('*')
      .eq('root_id', rootId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching log versions:', error);
      return [];
    }

    return data || [];
  }

  async updateLog(logId: string, updates: Partial<Log>): Promise<Log | null> {
    console.log('=== UPDATE LOG DEBUG ===');
    console.log('Log ID:', logId);
    console.log('Updates:', JSON.stringify(updates, null, 2));

    const { data, error } = await this.supabase
      .from('logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      console.error('Error updating log:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('Update successful, data:', data);
    console.log('=== UPDATE LOG DEBUG END ===');
    return data;
  }

  // Storage methods
  async uploadLogPhoto(file: File, logId: string): Promise<string | null> {
    const fileName = `${logId}/${Date.now()}-${file.name}`;

    const { data, error } = await this.supabase.storage
      .from('log-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading photo:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('log-photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async deleteLogPhoto(photoUrl: string): Promise<boolean> {
    // Extract file path from URL
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const logId = pathParts[pathParts.length - 2];
    const filePath = `${logId}/${fileName}`;

    const { error } = await this.supabase.storage
      .from('log-photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const db = new Database();

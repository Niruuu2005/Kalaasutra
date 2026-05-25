// src/lib/services/auth-helper.ts
// Helper function to validate admin access on server side

import { createClient as createServerClient } from '@/lib/supabase/server';
import { UserRole } from '@/types/database.types';

export const ADMIN_ROLES: UserRole[] = ['owner', 'admin'];

export function isRoleAllowed(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

export async function assertRole(allowedRoles: UserRole[]) {
  const supabase = await createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  // Fetch the profile role directly from the DB
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Forbidden: Profile not found.');
  }

  if (!profile.is_active) {
    throw new Error('Forbidden: Account is inactive.');
  }

  const role = profile.role as UserRole;
  if (!isRoleAllowed(role, allowedRoles)) {
    throw new Error(`Forbidden: Insufficient permissions. Required one of: ${allowedRoles.join(', ')}`);
  }

  return { user, profile };
}

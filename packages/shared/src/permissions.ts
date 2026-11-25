export const STAFF_ROLES = ['admin', 'analyst', 'viewer'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_STATUSES = ['invited', 'active', 'suspended'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const PERMISSIONS = [
  'cases.view',
  'audit.view',
  'cases.act',
  'settings.edit',
  'demo.use',
  'team.manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const GRANTS: Record<StaffRole, readonly Permission[]> = {
  admin: ['cases.view', 'audit.view', 'cases.act', 'settings.edit', 'demo.use', 'team.manage'],
  analyst: ['cases.view', 'audit.view', 'cases.act'],
  viewer: ['cases.view', 'audit.view'],
};

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  return role ? GRANTS[role].includes(permission) : false;
}

export function permissionsFor(role: StaffRole): readonly Permission[] {
  return GRANTS[role];
}

export function canSignIn(status: StaffStatus): boolean {
  return status !== 'suspended';
}

export interface RoleChange {
  actorId: string;
  targetId: string;
  targetRole: StaffRole;
  targetStatus: StaffStatus;
  nextRole?: StaffRole;
  nextStatus?: StaffStatus;
  activeAdminCount: number;
}

export type RoleChangeError = 'self_change' | 'last_admin' | null;

export function checkRoleChange(change: RoleChange): RoleChangeError {
  const demotes =
    change.nextRole !== undefined && change.nextRole !== 'admin' && change.targetRole === 'admin';
  const deactivates =
    change.nextStatus === 'suspended' &&
    change.targetRole === 'admin' &&
    change.targetStatus === 'active';
  if (
    change.actorId === change.targetId &&
    (change.nextRole !== undefined || change.nextStatus === 'suspended')
  ) {
    return 'self_change';
  }
  if (
    (demotes || deactivates) &&
    change.targetStatus === 'active' &&
    change.activeAdminCount <= 1
  ) {
    return 'last_admin';
  }
  return null;
}

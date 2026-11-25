import type { StaffRole, StaffStatus } from '../common/domain.js';

export type RoleChangeError = 'self_change' | 'last_admin' | null;

export interface RoleChange {
  actorId: string;
  targetId: string;
  targetRole: StaffRole;
  targetStatus: StaffStatus;
  nextRole?: StaffRole;
  nextStatus?: StaffStatus;
  activeAdminCount: number;
}

/** Mirrors `checkRoleChange` in packages/shared/src/permissions.ts. */
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

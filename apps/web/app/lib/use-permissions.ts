import { useMe } from '~/api/hooks';
import { can, type Permission, type StaffRole } from '@resolve/shared';

export function usePermissions() {
  const me = useMe();
  const role: StaffRole | undefined = me.data?.role;
  return {
    role,
    ready: me.isSuccess,
    can: (permission: Permission) => can(role, permission),
  };
}

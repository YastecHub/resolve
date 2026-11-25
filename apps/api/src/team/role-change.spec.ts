import { checkRoleChange, type RoleChange } from './role-change.js';

const base: RoleChange = {
  actorId: 'usr_admin',
  targetId: 'usr_other',
  targetRole: 'admin',
  targetStatus: 'active',
  activeAdminCount: 2,
};

describe('checkRoleChange', () => {
  it('stops people changing their own role or suspending themselves', () => {
    expect(checkRoleChange({ ...base, targetId: 'usr_admin', nextRole: 'viewer' })).toBe(
      'self_change',
    );
    expect(checkRoleChange({ ...base, targetId: 'usr_admin', nextStatus: 'suspended' })).toBe(
      'self_change',
    );
  });

  it('keeps at least one active admin', () => {
    expect(checkRoleChange({ ...base, activeAdminCount: 1, nextRole: 'analyst' })).toBe(
      'last_admin',
    );
    expect(checkRoleChange({ ...base, activeAdminCount: 1, nextStatus: 'suspended' })).toBe(
      'last_admin',
    );
  });

  it('allows the change otherwise', () => {
    expect(checkRoleChange({ ...base, nextRole: 'analyst' })).toBeNull();
    expect(
      checkRoleChange({ ...base, targetRole: 'analyst', activeAdminCount: 1, nextRole: 'admin' }),
    ).toBeNull();
    expect(
      checkRoleChange({
        ...base,
        targetStatus: 'invited',
        activeAdminCount: 1,
        nextStatus: 'suspended',
      }),
    ).toBeNull();
  });
});

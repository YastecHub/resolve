import { describe, expect, it } from 'vitest';
import { canSignIn, checkRoleChange, can, permissionsFor } from './permissions';

describe('can', () => {
  it('lets admins do everything', () => {
    for (const permission of permissionsFor('admin')) expect(can('admin', permission)).toBe(true);
    expect(can('admin', 'team.manage')).toBe(true);
  });

  it('lets analysts act on cases but not change settings or manage the team', () => {
    expect(can('analyst', 'cases.act')).toBe(true);
    expect(can('analyst', 'settings.edit')).toBe(false);
    expect(can('analyst', 'demo.use')).toBe(false);
    expect(can('analyst', 'team.manage')).toBe(false);
  });

  it('keeps viewers read-only', () => {
    expect(can('viewer', 'cases.view')).toBe(true);
    expect(can('viewer', 'audit.view')).toBe(true);
    expect(can('viewer', 'cases.act')).toBe(false);
    expect(can('viewer', 'settings.edit')).toBe(false);
  });

  it('denies everything without a role', () => {
    expect(can(null, 'cases.view')).toBe(false);
    expect(can(undefined, 'audit.view')).toBe(false);
  });
});

describe('canSignIn', () => {
  it('blocks only suspended accounts', () => {
    expect(canSignIn('active')).toBe(true);
    expect(canSignIn('invited')).toBe(true);
    expect(canSignIn('suspended')).toBe(false);
  });
});

describe('checkRoleChange', () => {
  const base = {
    actorId: 'a',
    targetId: 'b',
    targetRole: 'analyst' as const,
    targetStatus: 'active' as const,
    activeAdminCount: 2,
  };

  it('allows an admin to change someone else', () => {
    expect(checkRoleChange({ ...base, nextRole: 'viewer' })).toBeNull();
    expect(checkRoleChange({ ...base, nextStatus: 'suspended' })).toBeNull();
  });

  it('blocks changing or suspending yourself', () => {
    expect(checkRoleChange({ ...base, targetId: 'a', nextRole: 'viewer' })).toBe('self_change');
    expect(checkRoleChange({ ...base, targetId: 'a', nextStatus: 'suspended' })).toBe(
      'self_change',
    );
  });

  it('blocks removing the last active admin', () => {
    const lastAdmin = { ...base, targetRole: 'admin' as const, activeAdminCount: 1 };
    expect(checkRoleChange({ ...lastAdmin, nextRole: 'analyst' })).toBe('last_admin');
    expect(checkRoleChange({ ...lastAdmin, nextStatus: 'suspended' })).toBe('last_admin');
  });

  it('allows demoting an admin while another admin remains', () => {
    expect(checkRoleChange({ ...base, targetRole: 'admin', nextRole: 'analyst' })).toBeNull();
  });
});

import { useState } from 'react';
import { toast } from 'sonner';
import {
  STAFF_ROLES,
  can,
  type Permission,
  type StaffRole,
  type StaffStatus,
} from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { NotPermitted } from '~/components/not-permitted';
import { Button } from '~/components/ui/button';
import { CopyableId } from '~/components/ui/copyable-id';
import { Dialog } from '~/components/ui/dialog';
import { EmptyState } from '~/components/ui/empty-state';
import { ErrorCard } from '~/components/ui/error-card';
import { Field, Input } from '~/components/ui/field';
import { PageHeader } from '~/components/ui/page-header';
import { RelativeTime } from '~/components/ui/relative-time';
import { RolePill } from '~/components/ui/role-pill';
import { SegmentedControl } from '~/components/ui/segmented-control';
import { Select } from '~/components/ui/select';
import { SkeletonTableRows } from '~/components/ui/skeleton';
import { ROLE_LABELS, ROLE_SUMMARIES } from '~/lib/labels';
import { usePermissions } from '~/lib/use-permissions';
import { cn } from '~/lib/cn';
import {
  useChangeRole,
  useChangeStatus,
  useInviteStaff,
  useMe,
  useTeam,
} from '~/design/screens/data/hooks';
import type { StaffMember } from '~/design/screens/data/types';
import { ApiError } from '@resolve/api-client';

export function meta() {
  return [{ title: 'Team · Resolve' }];
}

const CAPABILITIES: { permission: Permission; label: string }[] = [
  { permission: 'cases.view', label: 'See cases and traces' },
  { permission: 'audit.view', label: 'See the audit trail' },
  { permission: 'cases.act', label: 'Approve, override, escalate' },
  { permission: 'settings.edit', label: 'Change settings' },
  { permission: 'demo.use', label: 'Use demo tools' },
  { permission: 'team.manage', label: 'Manage the team' },
];

const STATUS_STYLES: Record<StaffStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success' },
  invited: { label: 'Invited', className: 'bg-info-soft text-info' },
  suspended: {
    label: 'Suspended',
    className: 'border border-border-strong bg-surface-3 text-text',
  },
};

function StatusPill({ status }: { status: StaffStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-2 rounded-full pr-3 pl-2.5 text-caption',
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function errorText(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong on our side. Try again.';
}

function RoleGuide() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {STAFF_ROLES.map((role) => (
        <section
          key={role}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex flex-col gap-1.5">
            <RolePill role={role} className="w-fit" />
            <p className="text-small text-text-2">{ROLE_SUMMARIES[role]}</p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {CAPABILITIES.map((item) => {
              const allowed = can(role, item.permission);
              return (
                <li
                  key={item.permission}
                  className={cn(
                    'flex items-center gap-2 text-small',
                    allowed ? 'text-text' : 'text-text-3',
                  )}
                >
                  <AppIcon
                    name={allowed ? 'common.check' : 'common.close'}
                    size={16}
                    className={allowed ? 'text-success' : 'text-text-3'}
                  />
                  <span className={allowed ? undefined : 'line-through'}>{item.label}</span>
                  <span className="sr-only">{allowed ? 'allowed' : 'not allowed'}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invite = useInviteStaff();
  const [form, setForm] = useState({
    name: '',
    email: '',
    staffId: '',
    role: 'analyst' as StaffRole,
  });
  const [error, setError] = useState<string | null>(null);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm({ name: '', email: '', staffId: '', role: 'analyst' });
      setError(null);
    }
  };

  const submit = () => {
    setError(null);
    invite.mutate(form, {
      onSuccess: (member) => {
        toast.success(
          `${member.name} is invited. They can sign in with staff ID ${member.staffId}.`,
        );
        close(false);
      },
      onError: (caught) => setError(errorText(caught)),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Invite staff"
      description="They can sign in with their staff ID and token as soon as you add them."
      actions={
        <>
          <Button variant="ghost" onClick={() => close(false)} disabled={invite.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={invite.isPending}
            loadingLabel="Inviting…"
            onClick={submit}
          >
            Invite
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Full name">
          {({ id }) => (
            <Input
              id={id}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              autoFocus
              placeholder="e.g. Amaka Obi"
            />
          )}
        </Field>
        <Field label="Work email">
          {({ id }) => (
            <Input
              id={id}
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="name@bank.example"
            />
          )}
        </Field>
        <Field label="Staff ID" hint="4 to 8 digits, printed on their staff card.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              inputMode="numeric"
              value={form.staffId}
              onChange={(event) =>
                setForm({ ...form, staffId: event.target.value.replace(/\D/g, '').slice(0, 8) })
              }
              className="tabular w-40"
            />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-text-2">Role</span>
          <SegmentedControl
            label="Role"
            className="w-full"
            options={STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
          />
          <p className="text-small text-text-3">{ROLE_SUMMARIES[form.role]}</p>
        </div>
        {error ? (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export default function Team() {
  const permissions = usePermissions();
  const me = useMe();
  const allowed = permissions.can('team.manage');
  const team = useTeam(allowed);
  const changeRole = useChangeRole();
  const changeStatus = useChangeStatus();
  const [inviting, setInviting] = useState(false);
  const [suspending, setSuspending] = useState<StaffMember | null>(null);

  if (permissions.ready && !allowed) {
    return (
      <>
        <PageHeader eyebrow="Team" title="Who can sign in, and what they can do." />
        <NotPermitted what="manage the team" />
      </>
    );
  }

  const selfStaffId = me.data?.staffId;
  const members = team.data ?? [];

  const onRole = (member: StaffMember, role: StaffRole) =>
    changeRole.mutate(
      { id: member.id, role },
      {
        onSuccess: () => toast.success(`${member.name} is now ${ROLE_LABELS[role].toLowerCase()}.`),
        onError: (error) => toast.error(errorText(error)),
      },
    );

  const onStatus = (member: StaffMember, status: 'suspended' | 'active') =>
    changeStatus.mutate(
      { id: member.id, status },
      {
        onSuccess: () => {
          setSuspending(null);
          toast.success(
            status === 'suspended'
              ? `${member.name} is suspended.`
              : `${member.name} is reinstated.`,
          );
        },
        onError: (error) => {
          setSuspending(null);
          toast.error(errorText(error));
        },
      },
    );

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Who can sign in, and what they can do."
        subtitle="Roles decide who can act on a case. Every change is logged."
        actions={
          <Button variant="primary" onClick={() => setInviting(true)}>
            <AppIcon name="nav.team" size={16} />
            Invite staff
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <RoleGuide />

        {team.isLoading ? (
          <div className="rounded-lg border border-border bg-surface shadow-card">
            <SkeletonTableRows rows={6} columns={6} />
          </div>
        ) : team.isError ? (
          <ErrorCard
            title="Couldn't load the team"
            layout="centered"
            className="py-16"
            message={errorText(team.error)}
            onRetry={() => void team.refetch()}
            retrying={team.isFetching}
          />
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface shadow-card">
            <EmptyState
              icon="nav.team"
              title="No one on the team yet"
              description="Invite the first person to give them access."
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table aria-label="Team" className="w-full border-collapse text-small">
                <thead>
                  <tr className="border-b border-border text-caption text-text-3">
                    {['Person', 'Staff ID', 'Role', 'Status', 'Last sign-in'].map((label) => (
                      <th key={label} scope="col" className="h-10 px-3 text-left font-medium">
                        {label}
                      </th>
                    ))}
                    <th scope="col" className="h-10 px-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const self = member.staffId === selfStaffId;
                    return (
                      <tr
                        key={member.id}
                        className="h-16 border-b border-border last:border-b-0 hover:bg-surface-2"
                      >
                        <td className="px-3">
                          <div className="flex flex-col">
                            <span className="text-text">
                              {member.name}
                              {self ? (
                                <span className="ml-2 text-caption text-text-3">You</span>
                              ) : null}
                            </span>
                            <span className="text-caption text-text-3">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <CopyableId id={member.staffId} plain />
                        </td>
                        <td className="px-3">
                          {self ? (
                            <RolePill role={member.role} />
                          ) : (
                            <Select
                              size="sm"
                              aria-label={`Role for ${member.name}`}
                              value={member.role}
                              disabled={changeRole.isPending}
                              onChange={(event) => onRole(member, event.target.value as StaffRole)}
                              className="min-w-28"
                            >
                              {STAFF_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </Select>
                          )}
                        </td>
                        <td className="px-3">
                          <StatusPill status={member.status} />
                        </td>
                        <td className="px-3 whitespace-nowrap text-text-2">
                          {member.lastSignInAt ? (
                            <RelativeTime at={member.lastSignInAt} />
                          ) : (
                            <span className="text-text-3">Not yet</span>
                          )}
                        </td>
                        <td className="px-3 text-right">
                          {self ? null : member.status === 'suspended' ? (
                            <Button
                              size="sm"
                              loading={
                                changeStatus.isPending && changeStatus.variables?.id === member.id
                              }
                              loadingLabel="Reinstating…"
                              onClick={() => onStatus(member, 'active')}
                            >
                              Reinstate
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setSuspending(member)}>
                              Suspend
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <InviteDialog open={inviting} onOpenChange={setInviting} />

      <Dialog
        open={suspending !== null}
        onOpenChange={(open) => !open && setSuspending(null)}
        tone="danger"
        size="sm"
        title={`Suspend ${suspending?.name ?? ''}?`}
        description="They are signed out and can't sign in until you reinstate them. Their past actions stay in the audit trail."
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setSuspending(null)}
              disabled={changeStatus.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={changeStatus.isPending}
              loadingLabel="Suspending…"
              onClick={() => suspending && onStatus(suspending, 'suspended')}
            >
              Suspend
            </Button>
          </>
        }
      />
    </>
  );
}

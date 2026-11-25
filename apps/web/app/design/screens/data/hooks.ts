import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DisputeStatus, ResolutionAction, StaffRole } from '@resolve/shared';
import * as api from './sample-server';
import type {
  DisputeDetail,
  DisputeQuery,
  InviteStaff,
  PolicyConfig,
  TraceResponse,
} from './types';

export const USING_SAMPLE_DATA = true;

const ACTIVE = new Set<string>(['queued', 'investigating']);

export const keys = {
  me: ['me'] as const,
  team: ['team'] as const,
  access: (page: number, pageSize: number) => ['audit', 'access', page, pageSize] as const,
  profiles: ['profiles'] as const,
  config: ['config'] as const,
  metrics: ['metrics'] as const,
  disputes: (query: DisputeQuery) => ['disputes', query] as const,
  dispute: (id: string) => ['dispute', id] as const,
  trace: (id: string) => ['trace', id] as const,
  verify: (id: string) => ['verify', id] as const,
  investigations: (page: number, pageSize: number) =>
    ['audit', 'investigations', page, pageSize] as const,
  actions: (page: number, pageSize: number) => ['audit', 'actions', page, pageSize] as const,
  eval: ['eval'] as const,
};

export const fetchMe = api.getMe;
export const fetchCaseFile = api.getCaseFile;
export const fetchVerify = api.verifyChain;
export const signIn = api.signIn;

export function useProfiles() {
  return useQuery({ queryKey: keys.profiles, queryFn: api.getProfiles });
}

export function useConfig() {
  return useQuery({ queryKey: keys.config, queryFn: api.getConfig });
}

export function useMetrics() {
  return useQuery({ queryKey: keys.metrics, queryFn: api.getMetrics, refetchInterval: 8_000 });
}

export function useDisputes(query: DisputeQuery) {
  return useQuery({
    queryKey: keys.disputes(query),
    queryFn: () => api.listDisputes(query),
    placeholderData: keepPreviousData,
    refetchInterval: (state) =>
      state.state.data?.items.some((item) => ACTIVE.has(item.status)) ? 3_000 : false,
  });
}

export function useDisputeSearch(q: string) {
  return useQuery({
    queryKey: ['disputes', 'search', q],
    queryFn: () => api.listDisputes({ q: q.trim(), pageSize: 6, sort: 'priority', order: 'asc' }),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 2_000,
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: keys.dispute(id),
    queryFn: () => api.getDispute(id),
    refetchInterval: (state) => {
      const status = state.state.data?.dispute.status;
      return status && ACTIVE.has(status) ? 1_500 : false;
    },
  });
}

export function useTrace(id: string) {
  const client = useQueryClient();
  return useQuery({
    queryKey: keys.trace(id),
    queryFn: async (): Promise<TraceResponse> => {
      const previous = client.getQueryData<TraceResponse>(keys.trace(id));
      const after = previous?.steps.at(-1)?.seq ?? 0;
      const next = await api.getTrace(id, after);
      return { ...next, steps: [...(previous?.steps ?? []), ...next.steps] };
    },
    staleTime: 0,
    refetchInterval: (state) => (state.state.data?.done ? false : 1_500),
  });
}

export function useVerify(id: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.verify(id),
    queryFn: () => api.verifyChain(id),
    enabled,
    staleTime: 30_000,
  });
}

function useAfterAction(id: string) {
  const client = useQueryClient();
  return (detail?: DisputeDetail) => {
    if (detail) client.setQueryData(keys.dispute(id), detail);
    void client.invalidateQueries({ queryKey: ['disputes'] });
    void client.invalidateQueries({ queryKey: keys.metrics });
    void client.invalidateQueries({ queryKey: keys.dispute(id) });
    void client.invalidateQueries({ queryKey: ['audit'] });
  };
}

function useOptimisticStatus(id: string) {
  const client = useQueryClient();
  return {
    onMutate: async (status: DisputeStatus) => {
      await client.cancelQueries({ queryKey: keys.dispute(id) });
      const previous = client.getQueryData<DisputeDetail>(keys.dispute(id));
      client.setQueryData<DisputeDetail>(keys.dispute(id), (detail) =>
        detail ? { ...detail, dispute: { ...detail.dispute, status } } : detail,
      );
      return { previous };
    },
    rollback: (previous?: DisputeDetail) => {
      if (previous) client.setQueryData(keys.dispute(id), previous);
    },
  };
}

export function useApprove(id: string, resolvesTo: DisputeStatus = 'resolved') {
  const after = useAfterAction(id);
  const optimistic = useOptimisticStatus(id);
  return useMutation({
    mutationFn: (message?: string) => api.approve(id, message),
    onMutate: () => optimistic.onMutate(resolvesTo),
    onError: (_error, _vars, context) => optimistic.rollback(context?.previous),
    onSuccess: after,
  });
}

export function useOverride(id: string) {
  const after = useAfterAction(id);
  const optimistic = useOptimisticStatus(id);
  return useMutation({
    mutationFn: (body: { action: ResolutionAction; reason: string; message?: string }) =>
      api.override(id, body),
    onMutate: (body) => optimistic.onMutate(body.action === 'none' ? 'rejected' : 'resolved'),
    onError: (_error, _vars, context) => optimistic.rollback(context?.previous),
    onSuccess: after,
  });
}

export function useEscalate(id: string) {
  const after = useAfterAction(id);
  const optimistic = useOptimisticStatus(id);
  return useMutation({
    mutationFn: (reason: string) => api.escalate(id, reason),
    onMutate: () => optimistic.onMutate('escalated'),
    onError: (_error, _vars, context) => optimistic.rollback(context?.previous),
    onSuccess: after,
  });
}

export function useEditMessage(id: string) {
  const after = useAfterAction(id);
  return useMutation({
    mutationFn: (message: string) => api.editMessage(id, message),
    onSuccess: after,
  });
}

export function useRetry(id: string) {
  const client = useQueryClient();
  const after = useAfterAction(id);
  return useMutation({
    mutationFn: () => api.retry(id),
    onSuccess: (detail) => {
      client.removeQueries({ queryKey: keys.trace(id) });
      after(detail);
    },
  });
}

export function useSetProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.setProfile(name),
    onSuccess: (profiles) => {
      client.setQueryData(keys.profiles, profiles);
      void client.invalidateQueries({ queryKey: keys.config });
    },
  });
}

export function useTestProfile() {
  return useMutation({ mutationFn: (name: string) => api.testProfile(name) });
}

export function useSaveConfig() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (update: Partial<PolicyConfig>) => api.saveConfig(update),
    onSuccess: (config) => {
      client.setQueryData(keys.config, config);
      void client.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useInvestigations(page = 1, pageSize = 25) {
  return useQuery({
    queryKey: keys.investigations(page, pageSize),
    queryFn: () => api.listInvestigations(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useAnalystActions(page = 1, pageSize = 25) {
  return useQuery({
    queryKey: keys.actions(page, pageSize),
    queryFn: () => api.listAnalystActions(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useDemoSubmit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { count?: number; all?: boolean }) => api.demoSubmit(body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['disputes'] });
      void client.invalidateQueries({ queryKey: keys.metrics });
      void client.invalidateQueries({ queryKey: keys.eval });
    },
  });
}

export function useDemoEval(enabled: boolean) {
  return useQuery({ queryKey: keys.eval, queryFn: api.demoEval, enabled });
}

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: api.getMe, staleTime: 30_000 });
}

export function useTeam(enabled = true) {
  return useQuery({ queryKey: keys.team, queryFn: api.getTeam, enabled });
}

function useAfterTeamChange() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: keys.team });
    void client.invalidateQueries({ queryKey: ['audit'] });
    void client.invalidateQueries({ queryKey: keys.me });
  };
}

export function useInviteStaff() {
  const after = useAfterTeamChange();
  return useMutation({
    mutationFn: (body: InviteStaff) => api.inviteStaff(body),
    onSuccess: after,
  });
}

export function useChangeRole() {
  const after = useAfterTeamChange();
  return useMutation({
    mutationFn: (vars: { id: string; role: StaffRole }) => api.changeRole(vars.id, vars.role),
    onSuccess: after,
  });
}

export function useChangeStatus() {
  const after = useAfterTeamChange();
  return useMutation({
    mutationFn: (vars: { id: string; status: 'suspended' | 'active' }) =>
      api.changeStatus(vars.id, vars.status),
    onSuccess: after,
  });
}

export function useAccessEvents(page = 1, pageSize = 25, enabled = true) {
  return useQuery({
    queryKey: keys.access(page, pageSize),
    queryFn: () => api.listAccessEvents(page, pageSize),
    placeholderData: keepPreviousData,
    enabled,
  });
}

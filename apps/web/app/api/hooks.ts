import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMe,
  getMetrics,
  listAiProfiles,
  signIn as signInRequest,
  testAiProfile,
  updateConfig,
  type AiProfileDto,
  type MeDto,
  type MetricsDto,
} from '@resolve/api-client';
import type { AiProfileKind, ClassifiedType } from '@resolve/shared';
import { STAFF_SIGN_IN } from '~/lib/staff-sign-in';
import { setToken } from '~/lib/session';
import type { AiProfile, AiProfileTestResult, DisputeQuery, MeResponse, Metrics } from './types';

// Cache keys. Kept identical to the reference screens so invalidations line up
// while the remaining screens are wired one at a time.
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

function toMe(me: MeDto): MeResponse {
  return {
    email: me.email,
    name: me.name,
    staffId: me.staffId,
    role: me.role,
    // The API reports who signed in, not how. Staff-ID sign-in is the token flow;
    // otherwise the bank's single sign-on session answers for the user.
    authMode: STAFF_SIGN_IN ? 'dev' : 'access',
    signedInAt: me.lastSignInAt ? Date.parse(me.lastSignInAt) : null,
  };
}

function toMetrics(m: MetricsDto): Metrics {
  return {
    countsByStatus: { ...m.countsByStatus },
    resolvedCount: m.resolvedCount,
    autoResolutionRate: m.autoResolutionRate,
    reviewRate: m.reviewRate,
    overrideRate: m.overrideRate,
    avgInvestigationMs: m.avgInvestigationMs,
    p50InvestigationMs: m.p50InvestigationMs,
    p95InvestigationMs: m.p95InvestigationMs,
    sla: { atRisk: m.sla.atRisk, breached: m.sla.breached },
    throughputByHour: m.throughputByHour.map((entry) => ({
      hour: Date.parse(entry.hour),
      count: entry.count,
    })),
    byType: m.byType.map((entry) => ({ type: entry.type as ClassifiedType, count: entry.count })),
    outcomesByType: m.outcomesByType.map((entry) => ({
      type: entry.type as ClassifiedType,
      values: { ...entry.values },
    })),
    providerUsage: m.providerUsage.map((entry) => ({ ...entry })),
    oldestReviewAt: m.oldestReviewAt ? Date.parse(m.oldestReviewAt) : null,
  };
}

function toProfile(p: AiProfileDto): AiProfile {
  return {
    name: p.name,
    label: p.label,
    kind: p.kind as AiProfileKind,
    model: p.model,
    endpoint: p.endpoint,
    active: p.active,
  };
}

/** Exchange a staff email and ID for a token and keep it for this browser session. */
export async function signIn(email: string, staffId: string): Promise<void> {
  const res = await signInRequest({ email: email.trim().toLowerCase(), staffId: staffId.trim() });
  setToken(res.data.token);
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await getMe();
  return toMe(res.data);
}

async function fetchProfiles(): Promise<AiProfile[]> {
  const res = await listAiProfiles();
  return res.data.map(toProfile);
}

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: fetchMe, staleTime: 30_000 });
}

export function useProfiles() {
  return useQuery({ queryKey: keys.profiles, queryFn: fetchProfiles });
}

export function useMetrics() {
  return useQuery({
    queryKey: keys.metrics,
    queryFn: async () => toMetrics((await getMetrics()).data),
    refetchInterval: 8_000,
  });
}

export function useTestProfile() {
  return useMutation({
    mutationFn: async (name: string): Promise<AiProfileTestResult> => {
      const res = await testAiProfile(name);
      return res.data;
    },
  });
}

export function useSetProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      await updateConfig({ ai: { activeProfile: name } });
      return fetchProfiles();
    },
    onSuccess: (profiles) => {
      client.setQueryData(keys.profiles, profiles);
      void client.invalidateQueries({ queryKey: keys.config });
    },
  });
}

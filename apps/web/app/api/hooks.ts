import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveDispute,
  editDisputeMessage,
  escalateDispute,
  getConfig,
  getDispute,
  getDisputeCaseFile,
  getDisputeTrace,
  getMe,
  listDisputes,
  overrideDispute,
  retryDispute,
  verifyDisputeChain,
  getMetrics,
  listAiProfiles,
  signIn as signInRequest,
  testAiProfile,
  updateConfig,
  type AiProfileDto,
  type AnalystActionDto,
  type CaseFileDto,
  type DisputeDetailDto,
  type DisputeSummaryDto,
  type InvestigationSummaryDto,
  type OverrideDisputeDto,
  type SettingsDto,
  type TraceStepDto,
  type TransactionSummaryDto,
  type DisputeListItemDto,
  type ListDisputesParams,
  type ListDisputesSort,
  type MeDto,
  type MetricsDto,
} from '@resolve/api-client';
import type {
  AiProfileKind,
  ClassifiedType,
  DisputeStatus,
  ResolutionAction,
} from '@resolve/shared';
import { STAFF_SIGN_IN } from '~/lib/staff-sign-in';
import { setToken } from '~/lib/session';
import type {
  AiProfile,
  AiProfileTestResult,
  AnalystActionRow,
  CaseFile,
  DisputeDetail,
  DisputeListItem,
  DisputeQuery,
  DisputeSortField,
  DisputeSummary,
  InvestigationSummary,
  MeResponse,
  Metrics,
  Page,
  PolicyConfig,
  TraceResponse,
  TraceStepRow,
  TransactionSummary,
  VerifyResponse,
} from './types';

const ACTIVE = new Set<string>(['queued', 'investigating']);

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

// The API sorts by createdAt, slaDueAt, amountMinor and confidence. The queue also
// offers "priority" and "updated", so they map to the closest sortable field.
function toSort(sort: DisputeSortField | undefined): ListDisputesSort | undefined {
  switch (sort) {
    case 'createdAt':
    case 'slaDueAt':
    case 'amountMinor':
    case 'confidence':
      return sort;
    case 'updatedAt':
      return 'createdAt';
    case 'priority':
      return 'slaDueAt';
    default:
      return undefined;
  }
}

function toListItem(d: DisputeListItemDto): DisputeListItem {
  return {
    ...d,
    slaDueAt: Date.parse(d.slaDueAt),
    createdAt: Date.parse(d.createdAt),
    updatedAt: Date.parse(d.updatedAt),
  };
}

async function fetchDisputes(query: DisputeQuery): Promise<Page<DisputeListItem>> {
  const params: ListDisputesParams = {
    status: query.status,
    type: query.type,
    q: query.q,
    sort: toSort(query.sort),
    order: query.order,
    page: query.page,
    pageSize: query.pageSize,
  };
  const res = await listDisputes(params);
  return {
    items: res.data.map(toListItem),
    page: res.meta.page,
    pageSize: res.meta.pageSize,
    total: res.meta.total,
  };
}

export function useDisputes(query: DisputeQuery) {
  return useQuery({
    queryKey: keys.disputes(query),
    queryFn: () => fetchDisputes(query),
    placeholderData: keepPreviousData,
    refetchInterval: (state) =>
      state.state.data?.items.some((item) => ACTIVE.has(item.status as DisputeStatus))
        ? 3_000
        : false,
  });
}

export function useDisputeSearch(q: string) {
  return useQuery({
    queryKey: ['disputes', 'search', q],
    queryFn: () => fetchDisputes({ q: q.trim(), pageSize: 6, sort: 'priority', order: 'asc' }),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 2_000,
  });
}

const parse = (iso: string) => Date.parse(iso);
const parseOrNull = (iso: string | null) => (iso ? Date.parse(iso) : null);

function toSummary(d: DisputeSummaryDto): DisputeSummary {
  return {
    ...d,
    slaDueAt: parse(d.slaDueAt),
    createdAt: parse(d.createdAt),
    updatedAt: parse(d.updatedAt),
    resolvedAt: parseOrNull(d.resolvedAt),
  };
}

function toTransaction(t: TransactionSummaryDto): TransactionSummary {
  return { ...t, createdAt: parse(t.createdAt) };
}

function toInvestigation(i: InvestigationSummaryDto): InvestigationSummary {
  return {
    ...i,
    providerKind: i.providerKind as AiProfileKind | null,
    startedAt: parse(i.startedAt),
    finishedAt: parseOrNull(i.finishedAt),
  };
}

function toAnalystAction(a: AnalystActionDto): AnalystActionRow {
  return { ...a, createdAt: parse(a.createdAt) };
}

function toStep(s: TraceStepDto): TraceStepRow {
  return { ...s, createdAt: parse(s.createdAt) };
}

function toDetail(d: DisputeDetailDto): DisputeDetail {
  return {
    dispute: toSummary(d.dispute),
    transaction: toTransaction(d.transaction),
    customer: d.customer,
    investigation: d.investigation ? toInvestigation(d.investigation) : null,
    analystActions: d.analystActions.map(toAnalystAction),
  };
}

function toCaseFile(d: CaseFileDto): CaseFile {
  return {
    ...toDetail(d),
    steps: d.steps.map(toStep),
    chainVerification: d.chainVerification,
    generatedAt: parse(d.generatedAt),
  };
}

export async function fetchCaseFile(id: string): Promise<CaseFile> {
  return toCaseFile((await getDisputeCaseFile(id)).data);
}

async function fetchVerify(id: string): Promise<VerifyResponse> {
  return (await verifyDisputeChain(id)).data;
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: keys.dispute(id),
    queryFn: async () => toDetail((await getDispute(id)).data),
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
      const afterSeq = previous?.steps.at(-1)?.seq ?? 0;
      const { data } = await getDisputeTrace(id, { afterSeq });
      return {
        investigation: data.investigation ? toInvestigation(data.investigation) : null,
        steps: [...(previous?.steps ?? []), ...data.steps.map(toStep)],
        done: data.done,
      };
    },
    staleTime: 0,
    refetchInterval: (state) => (state.state.data?.done ? false : 1_500),
  });
}

export function useVerify(id: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.verify(id),
    queryFn: () => fetchVerify(id),
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

// Show the new status straight away; roll back if the API refuses.
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
    mutationFn: async (message?: string) =>
      toDetail((await approveDispute(id, message ? { message } : {})).data),
    onMutate: () => optimistic.onMutate(resolvesTo),
    onError: (_error, _vars, context) => optimistic.rollback(context?.previous),
    onSuccess: after,
  });
}

export function useOverride(id: string) {
  const after = useAfterAction(id);
  const optimistic = useOptimisticStatus(id);
  return useMutation({
    mutationFn: async (body: { action: ResolutionAction; reason: string; message?: string }) =>
      toDetail((await overrideDispute(id, body as OverrideDisputeDto)).data),
    onMutate: (body) => optimistic.onMutate(body.action === 'none' ? 'rejected' : 'resolved'),
    onError: (_error, _vars, context) => optimistic.rollback(context?.previous),
    onSuccess: after,
  });
}

export function useEscalate(id: string) {
  const after = useAfterAction(id);
  const optimistic = useOptimisticStatus(id);
  return useMutation({
    mutationFn: async (reason: string) => toDetail((await escalateDispute(id, { reason })).data),
    onMutate: () => optimistic.onMutate('escalated'),
    onError: (_error, _vars, context) => optimistic.rollback(context?.previous),
    onSuccess: after,
  });
}

export function useEditMessage(id: string) {
  const after = useAfterAction(id);
  return useMutation({
    mutationFn: async (message: string) =>
      toDetail((await editDisputeMessage(id, { message })).data),
    onSuccess: after,
  });
}

export function useRetry(id: string) {
  const client = useQueryClient();
  const after = useAfterAction(id);
  return useMutation({
    mutationFn: async () => toDetail((await retryDispute(id)).data),
    onSuccess: (detail) => {
      client.removeQueries({ queryKey: keys.trace(id) });
      after(detail);
    },
  });
}

// The API config is nested (policy, agent, ai); the screens read a flat policy view.
function toPolicyConfig(c: SettingsDto): PolicyConfig {
  return {
    confidenceThreshold: c.policy.confidenceThreshold,
    valueCapMinor: c.policy.valueCapMinor,
    executionMode: c.policy.executionMode,
    maxSteps: c.agent.maxSteps,
  };
}

export function useConfig() {
  return useQuery({
    queryKey: keys.config,
    queryFn: async () => toPolicyConfig((await getConfig()).data),
  });
}

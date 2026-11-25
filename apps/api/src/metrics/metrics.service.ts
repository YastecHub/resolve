import { Inject, Injectable } from '@nestjs/common';
import { DISPUTE_STATUSES, SLA_AT_RISK_HOURS, type DisputeStatus } from '../common/domain.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { MetricsDto } from './metrics.dto.js';
import { percentile } from './percentile.js';

const HOUR = 3_600_000;
const ratio = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 1000);
const OPEN: DisputeStatus[] = ['queued', 'investigating', 'awaiting_review', 'escalated', 'failed'];

@Injectable()
export class MetricsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async get(now = new Date()): Promise<MetricsDto> {
    const [
      byStatus,
      agentResolved,
      analystResolved,
      overrides,
      investigations,
      atRisk,
      breached,
      oldestReview,
      latest,
    ] = await Promise.all([
      this.prisma.dispute.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.dispute.count({
        where: { resolvedBy: 'agent', status: { in: ['resolved', 'rejected'] } },
      }),
      this.prisma.dispute.count({
        where: { resolvedBy: 'analyst', status: { in: ['resolved', 'rejected'] } },
      }),
      this.prisma.analystAction.count({ where: { action: 'override' } }),
      this.prisma.investigation.findMany({
        where: { status: 'completed', finishedAt: { not: null } },
        select: { startedAt: true, finishedAt: true, profile: true, model: true },
      }),
      this.prisma.dispute.count({
        where: {
          status: { in: OPEN },
          slaDueAt: { gte: now, lte: new Date(now.getTime() + SLA_AT_RISK_HOURS * HOUR) },
        },
      }),
      this.prisma.dispute.count({ where: { status: { in: OPEN }, slaDueAt: { lt: now } } }),
      this.prisma.dispute.findFirst({
        where: { status: { in: ['awaiting_review', 'escalated'] } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.investigation.findMany({
        where: { status: 'completed', latestFor: { isNot: null } },
        select: { classifiedType: true, policyDisposition: true },
      }),
    ]);

    const countsByStatus = Object.fromEntries(DISPUTE_STATUSES.map((s) => [s, 0])) as Record<
      DisputeStatus,
      number
    >;
    for (const g of byStatus) countsByStatus[g.status] = g._count._all;
    const finished = countsByStatus.resolved + countsByStatus.rejected;

    const durations = investigations
      .map((i) => i.finishedAt!.getTime() - i.startedAt.getTime())
      .sort((a, b) => a - b);
    const avg = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const hourStart = Math.floor(now.getTime() / HOUR) * HOUR;
    const buckets = new Map<number, number>();
    for (let h = 23; h >= 0; h--) buckets.set(hourStart - h * HOUR, 0);
    for (const i of investigations) {
      const bucket = Math.floor(i.finishedAt!.getTime() / HOUR) * HOUR;
      if (buckets.has(bucket)) buckets.set(bucket, buckets.get(bucket)! + 1);
    }

    const byType = new Map<string, { count: number; auto_resolve: number; needs_review: number }>();
    for (const i of latest) {
      if (!i.classifiedType) continue;
      const entry = byType.get(i.classifiedType) ?? { count: 0, auto_resolve: 0, needs_review: 0 };
      entry.count++;
      if (i.policyDisposition) entry[i.policyDisposition]++;
      byType.set(i.classifiedType, entry);
    }

    const usage = new Map<
      string,
      { profile: string; model: string; count: number; totalMs: number }
    >();
    for (const i of investigations) {
      const key = `${i.profile}|${i.model}`;
      const entry = usage.get(key) ?? { profile: i.profile, model: i.model, count: 0, totalMs: 0 };
      entry.count++;
      entry.totalMs += i.finishedAt!.getTime() - i.startedAt.getTime();
      usage.set(key, entry);
    }

    return {
      countsByStatus,
      resolvedCount: countsByStatus.resolved,
      autoResolutionRate: ratio(agentResolved, finished),
      reviewRate: ratio(
        countsByStatus.awaiting_review + countsByStatus.escalated + analystResolved,
        latest.length,
      ),
      overrideRate: ratio(overrides, analystResolved),
      avgInvestigationMs: avg,
      p50InvestigationMs: percentile(durations, 50),
      p95InvestigationMs: percentile(durations, 95),
      sla: { atRisk, breached },
      throughputByHour: [...buckets.entries()].map(([hour, count]) => ({
        hour: new Date(hour).toISOString(),
        count,
      })),
      byType: [...byType.entries()].map(([type, v]) => ({ type, count: v.count })),
      outcomesByType: [...byType.entries()].map(([type, v]) => ({
        type,
        values: { auto_resolve: v.auto_resolve, needs_review: v.needs_review },
      })),
      providerUsage: [...usage.values()].map((u) => ({
        profile: u.profile,
        model: u.model,
        count: u.count,
        avgMs: Math.round(u.totalMs / u.count),
      })),
      oldestReviewAt: oldestReview?.createdAt.toISOString() ?? null,
    };
  }
}

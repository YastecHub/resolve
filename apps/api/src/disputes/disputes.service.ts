import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DISPUTE_STATUSES, SLA_HOURS, type DisputeStatus } from '../common/domain.js';
import type { Paginated } from '../common/envelope.js';
import { AppException } from '../common/errors/app.exception.js';
import { newId } from '../common/ids.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../infra/prisma.service.js';
import {
  toAnalystAction,
  toCustomerSummary,
  toInvestigationSummary,
  toListItem,
  toSummary,
  toTransactionSummary,
} from './dispute.mapper.js';
import type {
  CreateDisputeDto,
  DisputeDetailDto,
  DisputeListItemDto,
  DisputeSummaryDto,
  ListDisputesQueryDto,
} from './dto/dispute.dto.js';

const LIST_INCLUDE = {
  transaction: { select: { reference: true } },
  customer: { select: { fullName: true } },
  latestInvestigation: true,
} satisfies Prisma.DisputeInclude;

export const notFound = (what: string) =>
  new AppException(HttpStatus.NOT_FOUND, { code: 'not_found', message: `${what} was not found.` });

@Injectable()
export class DisputesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Inserts the dispute as `queued`. Enqueuing is the caller's job, after this commits. */
  async create(body: CreateDisputeDto, now = new Date()): Promise<DisputeSummaryDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: body.transactionId },
    });
    if (!transaction) throw notFound('The transaction');

    try {
      const dispute = await this.prisma.dispute.create({
        data: {
          id: newId('dsp', now.getTime()),
          transactionId: transaction.id,
          customerId: transaction.customerId,
          reasonCode: body.reasonCode,
          customerNotes: body.customerNotes || null,
          amountMinor: transaction.amountMinor,
          slaDueAt: new Date(now.getTime() + SLA_HOURS * 3_600_000),
          createdAt: now,
        },
        include: LIST_INCLUDE,
      });
      return toSummary(dispute);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const open = await this.prisma.dispute.findFirst({
          where: { transactionId: transaction.id, status: { notIn: ['resolved', 'rejected'] } },
          select: { id: true },
        });
        throw new AppException(HttpStatus.CONFLICT, {
          code: 'conflict',
          message: 'This transaction already has an open dispute.',
          details: { disputeId: open?.id ?? null },
        });
      }
      throw error;
    }
  }

  async list(query: ListDisputesQueryDto): Promise<Paginated<DisputeListItemDto>> {
    const base: Prisma.DisputeWhereInput = {};
    if (query.type?.length) base.latestInvestigation = { classifiedType: { in: query.type } };
    if (query.q) {
      const q = query.q;
      base.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { customerId: { contains: q, mode: 'insensitive' } },
        { transaction: { reference: { contains: q, mode: 'insensitive' } } },
        { customer: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const where: Prisma.DisputeWhereInput = query.status?.length
      ? { ...base, status: { in: query.status } }
      : base;

    const orderBy: Prisma.DisputeOrderByWithRelationInput[] =
      query.sort === 'confidence'
        ? [{ latestInvestigation: { confidence: { sort: query.order, nulls: 'last' } } }]
        : [{ [query.sort]: query.order }];
    orderBy.push({ id: query.order });

    const [rows, total, grouped] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: LIST_INCLUDE,
      }),
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    ]);

    const countsByStatus = Object.fromEntries(DISPUTE_STATUSES.map((s) => [s, 0])) as Record<
      DisputeStatus,
      number
    >;
    for (const group of grouped) countsByStatus[group.status] = group._count._all;

    return {
      items: rows.map(toListItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      extraMeta: { countsByStatus },
    };
  }

  async detail(id: string): Promise<DisputeDetailDto> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        ...LIST_INCLUDE,
        transaction: { include: { merchant: true } },
        customer: true,
        analystActions: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!dispute) throw notFound('The dispute');
    return {
      dispute: toSummary(dispute),
      transaction: toTransactionSummary(dispute.transaction),
      customer: toCustomerSummary(dispute.customer),
      investigation: dispute.latestInvestigation
        ? toInvestigationSummary(dispute.latestInvestigation)
        : null,
      analystActions: dispute.analystActions.map(toAnalystAction),
    };
  }
}

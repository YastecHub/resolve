import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.decorators.js';
import { CaseFilesService } from '../casefiles/casefiles.service.js';
import type { DisputeStatus, ResolutionAction } from '../common/domain.js';
import { AppException } from '../common/errors/app.exception.js';
import { newId } from '../common/ids.js';
import { executeResolution, ExecutionError } from '../executor/executor.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../infra/prisma.service.js';
import { InvestigationService } from '../investigations/investigation.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { DisputesService, notFound } from './disputes.service.js';
import type { DisputeDetailDto } from './dto/dispute.dto.js';
import type {
  ApproveDisputeDto,
  EditMessageDto,
  EscalateDisputeDto,
  OverrideDisputeDto,
} from './dto/action.dto.js';

const REVIEWABLE: DisputeStatus[] = ['awaiting_review', 'escalated'];
const FINAL: DisputeStatus[] = ['resolved', 'rejected'];

export const invalidState = (
  status: string,
  message = "That action isn't allowed from this status.",
) => new AppException(HttpStatus.CONFLICT, { code: 'invalid_state', message, details: { status } });

type Tx = Prisma.TransactionClient;

@Injectable()
export class ActionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DisputesService) private readonly disputes: DisputesService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CaseFilesService) private readonly caseFiles: CaseFilesService,
    @Inject(InvestigationService) private readonly investigations: InvestigationService,
  ) {}

  approve(id: string, body: ApproveDisputeDto, user: AuthUser) {
    return this.act(id, REVIEWABLE, async (tx, dispute) => {
      const investigation = await this.latest(tx, dispute.latestInvestigationId);
      const recommended = investigation?.recommendedAction;
      if (!recommended || recommended === 'manual_review') {
        throw invalidState(dispute.status, 'Choose an action with Override.');
      }
      if (body.message) await this.setMessage(tx, investigation.id, body.message);
      await this.record(tx, id, user, 'approve');
      await this.execute(tx, id, recommended);
    });
  }

  override(id: string, body: OverrideDisputeDto, user: AuthUser) {
    return this.act(id, REVIEWABLE, async (tx, dispute) => {
      if (body.message) {
        const investigation = await this.latest(tx, dispute.latestInvestigationId);
        if (investigation) await this.setMessage(tx, investigation.id, body.message);
      }
      await this.record(tx, id, user, 'override', {
        overrideAction: body.action,
        reason: body.reason,
      });
      await this.execute(tx, id, body.action);
    });
  }

  escalate(id: string, body: EscalateDisputeDto, user: AuthUser) {
    return this.act(id, ['awaiting_review'], async (tx) => {
      await this.record(tx, id, user, 'escalate', { reason: body.reason });
      await tx.dispute.update({ where: { id }, data: { status: 'escalated' } });
    });
  }

  editMessage(id: string, body: EditMessageDto, user: AuthUser) {
    return this.act(
      id,
      ['queued', 'investigating', 'awaiting_review', 'escalated', 'failed'],
      async (tx, dispute) => {
        const investigation = await this.latest(tx, dispute.latestInvestigationId);
        if (!investigation) throw invalidState(dispute.status, 'There is no message to edit yet.');
        await this.setMessage(tx, investigation.id, body.message);
        await this.record(tx, id, user, 'edit_message');
      },
      { finalIsNoop: false },
    );
  }

  async retry(id: string, user: AuthUser): Promise<DisputeDetailDto> {
    let attempt = 0;
    const detail = await this.act(id, ['failed'], async (tx) => {
      await this.record(tx, id, user, 'retry');
      await tx.dispute.update({ where: { id }, data: { status: 'queued', lastError: null } });
      attempt = (await tx.investigation.count({ where: { disputeId: id } })) + 1;
    });
    if (attempt) await this.investigations.enqueue(id, attempt);
    return detail;
  }

  /**
   * Locks the dispute row, checks the status, runs the change, then returns the fresh detail.
   * Repeating an action on a finished dispute returns its state and writes nothing.
   */
  private async act(
    id: string,
    allowed: DisputeStatus[],
    change: (
      tx: Tx,
      dispute: { status: DisputeStatus; latestInvestigationId: string | null },
    ) => Promise<void>,
    options: { finalIsNoop?: boolean } = {},
  ): Promise<DisputeDetailDto> {
    let changed = false;
    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { status: DisputeStatus; latest_investigation_id: string | null }[]
      >`
        SELECT status, latest_investigation_id FROM disputes WHERE id = ${id} FOR UPDATE`;
      const row = rows[0];
      if (!row) throw notFound('The dispute');
      if (!allowed.includes(row.status)) {
        if ((options.finalIsNoop ?? true) && FINAL.includes(row.status)) return;
        throw invalidState(row.status);
      }
      await change(tx, { status: row.status, latestInvestigationId: row.latest_investigation_id });
      changed = true;
    });
    if (changed) await this.caseFiles.write(id);
    return this.disputes.detail(id);
  }

  private latest(tx: Tx, investigationId: string | null) {
    return investigationId ? tx.investigation.findUnique({ where: { id: investigationId } }) : null;
  }

  private setMessage(tx: Tx, investigationId: string, message: string) {
    return tx.investigation.update({
      where: { id: investigationId },
      data: { customerMessage: message },
    });
  }

  private record(
    tx: Tx,
    disputeId: string,
    user: AuthUser,
    action: 'approve' | 'override' | 'escalate' | 'edit_message' | 'retry',
    extra: { overrideAction?: ResolutionAction; reason?: string } = {},
  ) {
    return tx.analystAction.create({
      data: { id: newId('act'), disputeId, actorEmail: user.email, action, ...extra },
    });
  }

  private async execute(tx: Tx, disputeId: string, action: ResolutionAction) {
    const { agent } = await this.settings.get();
    try {
      await executeResolution(tx, {
        disputeId,
        action,
        actor: 'analyst',
        duplicateWindowMinutes: agent.duplicateWindowMinutes,
      });
    } catch (error) {
      if (error instanceof ExecutionError) {
        throw new AppException(HttpStatus.CONFLICT, {
          code: 'invalid_state',
          message: `${error.message} Choose a different action with Override.`,
          details: { status: 'awaiting_review', reason: error.code },
        });
      }
      throw error;
    }
  }
}

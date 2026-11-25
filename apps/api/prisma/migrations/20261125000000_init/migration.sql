-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('retail', 'sme');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('card_payment', 'transfer', 'pos', 'web');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('mobile', 'web', 'pos', 'atm', 'ussd');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('successful', 'failed', 'pending', 'reversed');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('debit', 'credit', 'reversal', 'refund');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('settled', 'failed', 'pending', 'not_applicable');

-- CreateEnum
CREATE TYPE "DisputeReasonCode" AS ENUM ('unauthorised', 'duplicate', 'failed_transfer', 'not_delivered', 'other');

-- CreateEnum
CREATE TYPE "ClassifiedType" AS ENUM ('failed_transfer_debit', 'duplicate_charge', 'unauthorised_payment', 'merchant_non_delivery', 'legitimate_transaction', 'unknown');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('queued', 'investigating', 'awaiting_review', 'resolved', 'rejected', 'escalated', 'failed');

-- CreateEnum
CREATE TYPE "ResolutionAction" AS ENUM ('reverse_debit', 'refund_duplicate', 'none');

-- CreateEnum
CREATE TYPE "Resolver" AS ENUM ('agent', 'analyst');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AgentOutcome" AS ENUM ('auto_resolve', 'escalate', 'reject');

-- CreateEnum
CREATE TYPE "RecommendedAction" AS ENUM ('reverse_debit', 'refund_duplicate', 'none', 'manual_review');

-- CreateEnum
CREATE TYPE "PolicyDisposition" AS ENUM ('auto_resolve', 'needs_review');

-- CreateEnum
CREATE TYPE "AgentStepKind" AS ENUM ('model', 'tool', 'system');

-- CreateEnum
CREATE TYPE "AnalystActionType" AS ENUM ('approve', 'override', 'escalate', 'edit_message', 'retry');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('admin', 'analyst', 'viewer');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('invited', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "AccessAction" AS ENUM ('invited', 'role_changed', 'suspended', 'reinstated', 'first_sign_in', 'demo_reset');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_masked" TEXT NOT NULL,
    "segment" "CustomerSegment" NOT NULL,
    "account_age_days" INTEGER NOT NULL,
    "risk_profile" "RiskLevel" NOT NULL,
    "home_city" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "dispute_rate_bps" INTEGER NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "trusted" BOOLEAN NOT NULL,
    "first_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "last_city" TEXT NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "merchant_id" TEXT,
    "counterparty_name" TEXT,
    "counterparty_bank" TEXT,
    "type" "TransactionType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "TransactionStatus" NOT NULL,
    "device_id" TEXT,
    "city" TEXT NOT NULL,
    "ip_country" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "entry_type" "LedgerEntryType" NOT NULL,
    "account_ref" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "memo" TEXT NOT NULL,
    "posted_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL,
    "failure_reason" TEXT,
    "settled_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "reason_code" "DisputeReasonCode" NOT NULL,
    "customer_notes" TEXT,
    "amount_minor" BIGINT NOT NULL,
    "classified_type" "ClassifiedType",
    "status" "DisputeStatus" NOT NULL DEFAULT 'queued',
    "resolution_action" "ResolutionAction",
    "resolved_by" "Resolver",
    "resolved_at" TIMESTAMPTZ(3),
    "last_error" TEXT,
    "latest_investigation_id" TEXT,
    "sla_due_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'running',
    "profile" TEXT NOT NULL,
    "provider_kind" TEXT,
    "model" TEXT NOT NULL,
    "outcome" "AgentOutcome",
    "confidence" DOUBLE PRECISION,
    "risk_level" "RiskLevel",
    "fraud_suspected" BOOLEAN NOT NULL DEFAULT false,
    "classified_type" "ClassifiedType",
    "recommended_action" "RecommendedAction",
    "reasoning" TEXT,
    "evidence" JSONB,
    "evidence_problems" JSONB,
    "customer_message" TEXT,
    "policy_disposition" "PolicyDisposition",
    "policy_reasons" JSONB,
    "evidence_valid" BOOLEAN NOT NULL DEFAULT false,
    "steps_count" INTEGER NOT NULL DEFAULT 0,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_steps" (
    "id" TEXT NOT NULL,
    "investigation_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "kind" "AgentStepKind" NOT NULL,
    "tool_name" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "prev_hash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyst_actions" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" "AnalystActionType" NOT NULL,
    "override_action" "ResolutionAction",
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyst_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'invited',
    "invited_by" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sign_in_at" TIMESTAMPTZ(3),

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_events" (
    "id" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" "AccessAction" NOT NULL,
    "target_email" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "demo_cases" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "reason_code" "DisputeReasonCode" NOT NULL,
    "customer_notes" TEXT,
    "expected_classified_type" "ClassifiedType" NOT NULL,
    "expected_disposition" "PolicyDisposition" NOT NULL,
    "consumed_dispute_id" TEXT,

    CONSTRAINT "demo_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "devices_customer_id_idx" ON "devices"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_customer_id_created_at_idx" ON "transactions"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_merchant_id_amount_minor_created_at_idx" ON "transactions"("merchant_id", "amount_minor", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_transaction_id_key" ON "settlements"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_latest_investigation_id_key" ON "disputes"("latest_investigation_id");

-- CreateIndex
CREATE INDEX "disputes_status_created_at_idx" ON "disputes"("status", "created_at");

-- CreateIndex
CREATE INDEX "disputes_sla_due_at_idx" ON "disputes"("sla_due_at");

-- CreateIndex
CREATE INDEX "disputes_transaction_id_idx" ON "disputes"("transaction_id");

-- CreateIndex
CREATE INDEX "investigations_finished_at_idx" ON "investigations"("finished_at");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_dispute_id_attempt_key" ON "investigations"("dispute_id", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_steps_investigation_id_seq_key" ON "agent_steps"("investigation_id", "seq");

-- CreateIndex
CREATE INDEX "analyst_actions_dispute_id_created_at_idx" ON "analyst_actions"("dispute_id", "created_at");

-- CreateIndex
CREATE INDEX "analyst_actions_created_at_idx" ON "analyst_actions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "staff_staff_id_key" ON "staff"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "access_events_created_at_idx" ON "access_events"("created_at");

-- CreateIndex
CREATE INDEX "demo_cases_scenario_idx" ON "demo_cases"("scenario");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_latest_investigation_id_fkey" FOREIGN KEY ("latest_investigation_id") REFERENCES "investigations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyst_actions" ADD CONSTRAINT "analyst_actions_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_cases" ADD CONSTRAINT "demo_cases_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written: Prisma can't express these.

-- One open dispute per transaction. `failed` counts as open: it can be retried.
CREATE UNIQUE INDEX "disputes_one_open_per_transaction"
  ON "disputes" ("transaction_id")
  WHERE "status" IN ('queued', 'investigating', 'awaiting_review', 'escalated', 'failed');

-- Audit tables are append-only for the app's own role, when it runs as one.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'resolve_app') THEN
    REVOKE UPDATE, DELETE ON "agent_steps", "analyst_actions", "access_events" FROM resolve_app;
  END IF;
END
$$;

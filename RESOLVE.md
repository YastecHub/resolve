# resolve

The single source of truth for what resolve is, who it is for, how it behaves, and what we are building at the Ogun Innovate Hackathon. If another document disagrees with this one, this one wins, and the other document gets fixed.

---

## 1. One line

resolve investigates disputed bank transactions with an AI agent, lets the bank's own rules decide the outcome, and keeps a tamper-evident record of every step.

## 2. The problem

When a transfer fails or a card is charged twice, the customer calls the bank. Someone in the back office then opens the core banking system, the ledger, the payment switch, the device logs and the customer's history, works out what happened, and writes back. It takes days, sometimes weeks.

- Four Nigerian banks alone logged about 8 million customer complaints in 2024.
- Instant transfers moved over ₦1 quadrillion in the same period. Every failed one is a potential dispute.
- The CBN expects complaints to be handled within tight windows and fines banks for breaches.

Our team lead, Oluwadarasimi, was debited for an Oscafest ticket that never came through and spent two weeks chasing the bank. That is the experience resolve exists to end.

## 3. Who uses it

| Person                                               | What they need from resolve                                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Customer** (indirect)                              | A fast, plain-language answer and their money back when they are owed it                                                          |
| **Bank channel** (app, USSD, branch, contact centre) | One API to file a dispute against a transaction                                                                                   |
| **Analyst**                                          | A queue of cases that need a human, each with the evidence already gathered and a recommendation to approve, override or escalate |
| **Admin**                                            | Control over the AI model, the policy thresholds and who has access                                                               |
| **Auditor or regulator**                             | Proof of what was decided, why, by whom, and that the record has not been edited                                                  |

## 4. Principles

1. **The AI investigates. The bank's rules decide.** The model recommends; a deterministic policy engine decides whether a case can be auto-resolved. The model never moves money.
2. **Every claim cites evidence.** Each statement in a decision points to a specific tool call made in that investigation, and we verify the citation is real.
3. **Read-only by default.** The agent's tools can look at bank data, never change it. Only a separate executor moves money, and only after the rules pass or a human approves.
4. **Untrusted text stays untrusted.** Customer notes, merchant names and counterparty names are data, never instructions.
5. **Masked data only.** The model sees `****4821`, never a full account or phone number.
6. **Append-only, hash-chained audit.** Steps are written once and chained with SHA-256. Editing any step breaks the chain.
7. **Model-agnostic.** One adapter for any OpenAI-compatible model, hosted or running on the bank's own servers. Models come from configuration.
8. **Money is integer kobo.** Never floats. Format to naira only at the UI edge.
9. **Runs on Nigerian infrastructure.** Deployed on Nobus Cloud, or inside the bank's own network.

## 5. How a dispute moves through resolve

1. **Intake.** A bank channel calls `POST /api/v1/disputes` with a transaction ID, a reason code and the customer's own words. resolve rejects unknown transactions (404) and a second open dispute on the same transaction (409). The dispute starts `queued` with a resolution deadline.
2. **Queue.** The dispute is placed on a durable job queue so spikes wait their turn instead of failing.
3. **Investigation.** The agent runs a bounded loop (at most 8 model turns). In each turn the model may call read-only tools. Every model call and tool call is written as an audit step.
4. **Decision.** The agent ends by calling `submit_decision` with a structured payload. resolve validates its shape, then checks every evidence citation.
5. **Policy.** The policy engine runs 11 rules. If none trigger, the dispute is auto-resolved. If any trigger, it goes to an analyst with the list of reasons.
6. **Action.** Auto-resolve calls the executor, which posts the reversal or refund atomically and idempotently. Otherwise the dispute waits in `awaiting_review`.
7. **Review.** An analyst approves, overrides (with a written reason) or escalates. Every action is recorded.
8. **Record.** A case file (dispute, transaction, investigation, steps, analyst actions, chain verification) is stored and can be downloaded.

### Dispute states

| From                             | Event                                          | To                                                            |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| (new)                            | dispute filed                                  | `queued`                                                      |
| `queued`                         | worker starts                                  | `investigating`                                               |
| `investigating`                  | policy auto-resolves and the executor succeeds | `resolved` (by agent)                                         |
| `investigating`                  | policy needs review                            | `awaiting_review`                                             |
| `investigating`                  | retries exhausted                              | `failed`                                                      |
| `awaiting_review` or `escalated` | approve                                        | `resolved`, or `rejected` if the recommendation was to reject |
| `awaiting_review` or `escalated` | override with an action                        | `resolved`                                                    |
| `awaiting_review` or `escalated` | override with no action                        | `rejected`                                                    |
| `awaiting_review`                | escalate                                       | `escalated`                                                   |
| `failed`                         | retry                                          | `queued`                                                      |

Any other transition returns `409 invalid_state`. Repeating an action on a finished dispute returns its current state and changes nothing.

## 6. The agent

### Tools

| Tool                        | Reads                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- |
| `get_transaction`           | type, channel, amount, status, merchant or counterparty, city, IP country, device |
| `get_ledger_entries`        | debits, credits, reversals and refunds for the transaction                        |
| `get_settlement_status`     | settled, failed or pending, failure reason, age                                   |
| `get_device_and_location`   | device trusted, first seen, city matches home, IP country                         |
| `get_customer_profile`      | segment, risk, account age, recent disputes, typical amount, usual channels       |
| `get_customer_history`      | recent transactions (capped)                                                      |
| `get_merchant_info`         | category, dispute rate, flagged, prior purchases by this customer                 |
| `find_related_transactions` | same amount or same merchant within a time window                                 |
| `submit_decision`           | terminal: submits the decision and ends the loop                                  |

Tool parameters are validated. Lists are capped at 20 rows and outputs at 4 KB. Every personal field is masked.

### Decision

| Field                | Values                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `classified_type`    | `failed_transfer_debit`, `duplicate_charge`, `unauthorised_payment`, `merchant_non_delivery`, `legitimate_transaction`, `unknown` |
| `outcome`            | `auto_resolve`, `escalate`, `reject`                                                                                              |
| `confidence`         | 0 to 1                                                                                                                            |
| `risk_level`         | `low`, `medium`, `high`                                                                                                           |
| `fraud_suspected`    | boolean                                                                                                                           |
| `recommended_action` | `reverse_debit`, `refund_duplicate`, `none`, `manual_review`                                                                      |
| `reasoning`          | 50 to 1,500 characters                                                                                                            |
| `evidence`           | 1 to 10 items of `{ tool_call_id, claim }`                                                                                        |
| `customer_message`   | 20 to 800 characters, plain English, masked identifiers only                                                                      |

### Limits

- At most 8 model turns. One repair attempt for an invalid decision, one nudge if the model answers without calling a tool, then a forced decision, then a fallback escalation with confidence 0.
- Model calls time out at 60 seconds and retry with backoff on rate limits, server errors and network errors.

## 7. The policy engine

A pure function. All rules are evaluated and every triggered reason is reported. A case is auto-resolved only when none trigger.

| #   | Reason                         | Triggers when                                                        |
| --- | ------------------------------ | -------------------------------------------------------------------- |
| 1   | `evidence_validation_failed`   | a citation is missing, not a tool call, or points at a failed call   |
| 2   | `fraud_suspected`              | the decision flags fraud                                             |
| 3   | `review_type`                  | the type always needs a person (unauthorised, non-delivery, unknown) |
| 4   | `above_value_cap`              | the amount is above the cap                                          |
| 5   | `rejection_needs_confirmation` | the agent wants to reject                                            |
| 6   | `agent_escalated`              | the agent escalated                                                  |
| 7   | `low_confidence`               | confidence is below the threshold                                    |
| 8   | `type_not_auto_eligible`       | the type is not on the auto list                                     |
| 9   | `action_type_mismatch`         | the action does not fit the type                                     |
| 10  | `insufficient_evidence`        | fewer citations than the minimum                                     |
| 11  | `recommend_only_mode`          | automatic execution is switched off                                  |

### Defaults (all configurable by an admin)

| Setting                   | Default                                     |
| ------------------------- | ------------------------------------------- |
| Confidence threshold      | 0.90                                        |
| Value cap                 | ₦50,000                                     |
| Auto-eligible types       | failed transfer debit, duplicate charge     |
| Review-only types         | unauthorised payment, merchant non-delivery |
| Minimum evidence for auto | 2                                           |
| Execution mode            | execute (or recommend only)                 |
| Agent step limit          | 8                                           |
| Duplicate window          | 10 minutes                                  |

## 8. Audit

- `hash = SHA-256(prev_hash | seq | kind | tool_name | canonicalJSON(input) | canonicalJSON(output))`, with 64 zeros as the first `prev_hash`.
- Verification recomputes the chain and reports `valid`, the number of steps checked, and the first broken step.
- App code never updates or deletes audit rows. A test fails the build if it does.
- The chain is tamper-evident, not tamper-proof: someone with full database access could rewrite the chain from a point onward. The production fix is anchoring chain heads outside the database and an insert-only database role for audit tables.

## 9. Access

| Permission                                       | Admin | Analyst | Viewer |
| ------------------------------------------------ | :---: | :-----: | :----: |
| View cases and audit                             |   ✓   |    ✓    |   ✓    |
| Approve, override, escalate, edit message, retry |   ✓   |    ✓    |        |
| Change settings and AI model                     |   ✓   |         |        |
| Manage team                                      |   ✓   |         |        |

Enforced on the server on every route. There is always at least one admin. Nobody can change their own role or suspend themselves. Every access change is recorded.

## 10. What we build at the hackathon

### In scope

- Dispute intake API, queue and worker
- The agent loop with the eight read tools and `submit_decision`
- Evidence validator, policy engine and executor
- Hash-chained audit with verification
- Dashboard: Overview, Cases, Case detail with the live investigation trace, Audit, Settings
- A synthetic bank (customers, merchants, devices, transactions, ledger, settlements) and seeded demo cases
- Deployment on Nobus Cloud behind nginx, with CI that deploys on every push to `main`

### Out of scope for the event

- Real core-banking integration (the tools run against the synthetic bank)
- Single sign-on (the demo uses a simple sign-in)
- Multi-tenancy, external audit anchoring, alerting and tracing

## 11. Success criteria

- A failed-transfer dispute goes from filed to resolved, with cited evidence, in about a minute.
- A risky dispute (fraud signals, above the cap) goes to an analyst with the reasons listed.
- The chain verifies on every finished case, and a tampered step is detected.
- The app is live on Nobus Cloud and redeploys automatically from `main`.

## 12. Glossary

| Term          | Meaning                                                                |
| ------------- | ---------------------------------------------------------------------- |
| Dispute       | A customer's complaint about one transaction                           |
| Investigation | One run of the agent on a dispute; a dispute can have several attempts |
| Step          | One model call or tool call inside an investigation, hash-chained      |
| Disposition   | The policy engine's result: `auto_resolve` or `needs_review`           |
| Executor      | The only code that moves money, idempotent and atomic                  |
| Case file     | The downloadable JSON record of a dispute and everything done on it    |
| Profile       | A configured AI model (hosted or on-premise)                           |
| Kobo          | One hundredth of a naira; all amounts are stored as integer kobo       |

## 13. Team

| Name                   | Role                             |
| ---------------------- | -------------------------------- |
| Adedigba Oluwadarasimi | Team lead, AI and infrastructure |
| Ridwanullah Baruwa     | Frontend                         |
| Yasir Oyebo            | Backend                          |

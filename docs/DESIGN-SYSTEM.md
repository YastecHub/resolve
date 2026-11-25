# Design system

The look and feel of resolve: a quiet, confident banking tool coloured with the Ogun Digital Summit brand. Green accent, green-black dark mode, Mona Sans headlines, and an Adire pattern used sparingly. Every screen uses these tokens and nothing else.

## Principles

1. **Quiet frame, one accent.** Neutral surfaces, generous space, one green used with purpose.
2. **Show the work.** The agent's reasoning, evidence and integrity checks are the product. Make them easy to scan.
3. **AI moments are marked.** The green-to-teal AI gradient appears only where the AI is acting: the investigating shimmer, the decision card edge, high-confidence arcs. Never as a background.
4. **Trust is visible.** Model location, confidence, deadline and chain integrity are always on screen.
5. **Dark mode is first-class.** Both themes ship at the same quality.
6. **Personality in the margins.** The Adire pattern and microcopy carry the brand; layouts stay calm.

**Voice:** direct, warm, plain. Sentence case. No exclamation marks, no emoji.

---

## Colour

### Brand (Adire)

| Token           | Value     | Use                                  |
| --------------- | --------- | ------------------------------------ |
| `--adire-plum`  | `#300048` | Adire pattern, plum stage            |
| `--adire-teal`  | `#06aed2` | Adire pattern                        |
| `--adire-mint`  | `#9ce4a2` | Adire pattern, accents on dark stage |
| `--adire-green` | `#00ba5a` | Adire pattern                        |
| `--adire-paper` | `#fcfcfc` | Pattern ground                       |
| `--adire-ink`   | `#0f1510` | Ink                                  |

### Stage (dark hero panels, login, sidebar)

| Token            | Value     |
| ---------------- | --------- |
| `--stage`        | `#0f1510` |
| `--stage-2`      | `#1a231c` |
| `--stage-line`   | `#26312a` |
| `--stage-text`   | `#f2f6f2` |
| `--stage-text-2` | `#b6c1b8` |
| `--stage-accent` | `#9ce4a2` |

### Semantic

| Token                          | Light                    | Dark                                    |
| ------------------------------ | ------------------------ | --------------------------------------- |
| `--bg`                         | `#f7f8f6`                | `#0f1510`                               |
| `--surface`                    | `#ffffff`                | `#151c16`                               |
| `--surface-2`                  | `#f0f2ef`                | `#1b241d`                               |
| `--surface-3`                  | `#e6e9e5`                | `#232e25`                               |
| `--border`                     | `#e2e6e1`                | `#243026`                               |
| `--border-strong`              | `#c9cfc8`                | `#36443a`                               |
| `--control-border`             | `#828a83`                | `#627066`                               |
| `--grid-line`                  | `#eceee9`                | `#18201a`                               |
| `--text`                       | `#0f1510`                | `#f2f6f2`                               |
| `--text-2`                     | `#475048`                | `#b6c1b8`                               |
| `--text-3`                     | `#636d65`                | `#8a978d`                               |
| `--accent`                     | `#157f2a`                | `#5bd977`                               |
| `--accent-soft`                | `#e4f4e6`                | `rgba(91, 217, 119, 0.14)`              |
| `--accent-text`                | `#126f24`                | `#8eeaa3`                               |
| `--accent-contrast`            | `#ffffff`                | `#0f1510`                               |
| `--success` / `--success-soft` | `#157f2a` / `#e4f4e6`    | `#5bd977` / `rgba(91, 217, 119, 0.12)`  |
| `--warning` / `--warning-soft` | `#a35a06` / `#fff1da`    | `#f5a524` / `rgba(245, 165, 36, 0.14)`  |
| `--danger` / `--danger-soft`   | `#bb3a30` / `#fdecea`    | `#ff7b6f` / `rgba(255, 123, 111, 0.14)` |
| `--info` / `--info-soft`       | `#0b7590` / `#e1f3f8`    | `#4cc9e6` / `rgba(76, 201, 230, 0.14)`  |
| `--plum` / `--plum-soft`       | `#6b2a9a` / `#f3eaf9`    | `#c9a2f0` / `rgba(201, 162, 240, 0.14)` |
| `--ai-from` → `--ai-to`        | `#12a04a` → `#06a5c9`    | `#3bdc78` → `#2cc8ec`                   |
| `--scrim`                      | `rgba(15, 21, 16, 0.45)` | `rgba(0, 0, 0, 0.6)`                    |

`--ai-gradient` is `linear-gradient(135deg, var(--ai-from) 0%, var(--ai-to) 100%)`.

Body text must meet 4.5:1 on `--surface`; `--text-3` is the lightest colour allowed for body text. Status, confidence, deadline and integrity never rely on colour alone.

### Meaning of colour

| Colour             | Means                                     |
| ------------------ | ----------------------------------------- |
| Green (accent)     | Primary action, success, the audit ledger |
| Teal / AI gradient | The AI is acting                          |
| Plum               | Rules and policy                          |
| Amber (warning)    | Needs a human                             |
| Red (danger)       | Failed, fraud, broken chain               |

---

## Typography

| Role    | Family                            | Fallbacks                    |
| ------- | --------------------------------- | ---------------------------- |
| Display | Mona Sans (variable, with italic) | Geist, system-ui             |
| Sans    | Geist (variable)                  | Inter, system-ui             |
| Mono    | Geist Mono (variable)             | ui-monospace, SFMono-Regular |

Root size is 95% of the browser default. Spacing stays on a 4 px grid.

| Style   | Size / line | Weight | Tracking | Use                                         |
| ------- | ----------- | ------ | -------- | ------------------------------------------- |
| Hero    | 48 / 52     | 800    | -0.03em  | Login and empty-state heroes (display face) |
| Lead    | 28 / 36     | 700    | -0.02em  | Page lead lines (display face)              |
| Display | 32 / 40     | 600    | -0.02em  | Large numbers                               |
| KPI     | 36 / 40     | 600    | -0.02em  | KPI cards                                   |
| Meter   | 28 / 32     | 600    |          | Confidence arc number                       |
| H1      | 24 / 32     | 600    | -0.015em | Page titles                                 |
| H2      | 18 / 26     | 600    | -0.01em  | Section titles                              |
| H3      | 15 / 22     | 600    |          | Card titles                                 |
| Body    | 14 / 22     | 400    |          | Default                                     |
| Small   | 13 / 20     | 400    |          | Table cells, secondary text                 |
| Caption | 12 / 16     | 500    | +0.01em  | Labels, metadata                            |
| Eyebrow | 12 / 16     | 500    | +0.08em  | Mono, uppercase, `--text-3`, above titles   |
| Code    | 12.5 / 20   | 400    |          | IDs, hashes, JSON (mono)                    |

Amounts, KPIs and table numbers use `font-variant-numeric: tabular-nums`.

---

## Space, shape, depth, motion

- **Spacing:** 4 px base: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80.
- **Radius:** `sm 6`, `md 12` (inputs, buttons), `lg 16` (cards), `xl 24` (dialogs, large panels), full (pills).
- **Shadows (light):** `--shadow-1: 0 1px 2px rgba(15,21,16,.06)`; `--shadow-2: 0 10px 28px -10px rgba(15,21,16,.2)` for popovers and dialogs; `--sticker: 0 1px 0 rgba(15,21,16,.04), 0 2px 6px -2px rgba(15,21,16,.18)`.
- **Shadows (dark):** none; use a 1 px border (`--border` or `--border-strong`) instead.
- **Focus:** 2 px accent outline with 2 px offset on `:focus-visible`. Inputs use a border plus a 3 px ring at 25% accent.
- **Motion:** `fast 120ms`, `base 180ms`, `slow 280ms`; easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Reduced motion keeps opacity changes only.

| Moment            | Motion                                              |
| ----------------- | --------------------------------------------------- |
| Route change      | fade in, 4 px rise, 180 ms                          |
| New trace step    | fade and 6 px rise, 180 ms, 40 ms stagger           |
| Investigating row | AI gradient sweep along the bottom edge, 1.6 s loop |
| Confidence arc    | draws to value, 700 ms                              |
| KPI numbers       | tween 600 ms                                        |
| Dialogs           | scale 0.98 to 1 with fade, 180 ms                   |
| Skeletons         | shimmer, 2 s loop                                   |

### Utilities

- `grid-paper`: 32 px grid of `--grid-line` lines, for heroes and empty states. Pair with `grid-fade` (mask to transparent downward).
- `eyebrow`: mono, uppercase, caption size, `--text-3`.
- `tabular`: tabular numbers.
- `skeleton`: shimmer between `--surface-2` and `--surface-3`.
- `sweep-edge`: AI gradient sweep for investigating rows.

---

## The Adire pattern

A repeating 160 × 80 tile of four motifs drawn on `--adire-paper`:

| Motif  | Drawing                                                                  |
| ------ | ------------------------------------------------------------------------ |
| Eye    | plum circle (r 18) with a paper centre (r 7)                             |
| Petals | four mint quarter-circles around a green centre (r 6)                    |
| Ring   | teal circle (r 18), paper ring (r 10), teal centre (r 4)                 |
| Leaf   | two plum quarter-circles on opposite corners around a green centre (r 8) |

Rows alternate the order so no motif touches itself. Use it as a band: the full-width foot of the login page, the foot of the sidebar, and the closing slide. Never behind text.

---

## Layout

- **Shell:** stage-coloured sidebar 248 px (collapsed 72 px) with grouped navigation and an Adire band at its foot; top bar 56 px with breadcrumb, pill search (`⌘K`) and the model pill; content scrolls on its own.
- **Content:** fluid, max 1440 px, page padding 32 px (24 px under 1280 px).
- **Page header:** eyebrow, H1, optional lead line on the left; actions on the right.
- **Grid:** 12 columns, 24 px gutters. Don't nest cards; use dividers.
- **Rhythm:** 24 px between sections, 16 px between related blocks, 8 px inside groups.

---

## Components

| Component                 | Spec                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status pill**           | Dot and label, fully rounded, soft background. Queued (neutral), Investigating (accent, pulsing dot), Needs review (warning), Escalated (info), Resolved (success, "by agent" or "by analyst"), Rejected (neutral strong), Failed (danger, retry).           |
| **Type badge**            | Icon and label, outline. Unauthorised uses the danger tint; other types are neutral.                                                                                                                                                                         |
| **Confidence meter**      | Compact: bar with percentage and a tick at the threshold; ≥ 90% success, 60 to 89% warning, below 60% danger. Large: 112 px arc with threshold tick, AI gradient stroke when high. Always has a text label for screen readers.                               |
| **Deadline ring**         | Small circular progress against the resolution window with "41h left" or "Overdue 3h". Green under 50%, amber to 85%, red beyond.                                                                                                                            |
| **KPI card**              | Caption label, KPI number, context line, optional sparkline. Links when it filters a list.                                                                                                                                                                   |
| **Table**                 | Sticky 40 px header, sortable columns, row hover `--surface-2`, numbers right-aligned, IDs in mono with copy. Rows 64 px (52 px compact). Footer with rows per page and pagination.                                                                          |
| **Model pill**            | In the top bar on every screen. On-premise: green tint, "Customer data stays inside your infrastructure." Hosted: neutral, "Masked case data is sent to the model provider."                                                                                 |
| **Trace step**            | Vertical timeline, 28 px nodes. Model turns have an AI gradient ring; tool calls show the tool icon, name in sentence case and duration; results collapse to one summary line with a raw JSON toggle. Each step has an anchor so citations can scroll to it. |
| **Decision card**         | AI gradient top edge. "Agent recommendation", outcome headline, type badge, large confidence meter, action, risk, fraud flag, "Why this needs review" as plain sentences, model and duration footer, and the Approve, Override, Escalate bar.                |
| **Evidence chip**         | Mono-tinted chip with the step ID; click scrolls to and highlights the step.                                                                                                                                                                                 |
| **Untrusted quote**       | Customer text in italics with a quote bar, always escaped.                                                                                                                                                                                                   |
| **Buttons**               | 36 px (32 compact), radius `md`. Primary (accent fill), secondary (surface with border), ghost, destructive. Loading shows a spinner and a verb without changing width.                                                                                      |
| **Inputs**                | 36 px, `--control-border`, focus ring; error border and message below.                                                                                                                                                                                       |
| **Dialog**                | Radius `xl`, tone badge, footer bar with an Esc hint; bottom sheet under 768 px.                                                                                                                                                                             |
| **Empty, loading, error** | Skeletons that mirror the layout; empty states with a 48 px icon, headline, helper and one action; error cards with a retry and collapsible request ID.                                                                                                      |

---

## Icons

Hugeicons through Iconify, used only through one `AppIcon` wrapper with semantic keys (`nav.cases`, `type.unauthorised`, `trace.ledger` and so on), so any icon can be swapped in one file. Sizes 16, 20, 24 and 48. Stroke, rounded style everywhere. Production builds bundle icons offline so the browser makes no calls to the public Iconify API.

---

## Microcopy

| Place                   | Copy                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| Overview, cases waiting | "Good afternoon. 4 cases are waiting on you."                          |
| Overview, none waiting  | "All clear. Nothing is waiting on you."                                |
| Empty cases             | "No cases yet. Submit a dispute to watch the agent work."              |
| Investigating           | "Agent is working. Steps appear as they happen."                       |
| Approve toast           | "Done. The customer message is ready to send."                         |
| Override dialog         | "Override the agent" · "Tell us why. This goes in the audit trail."    |
| Conflict                | "This case changed while you were looking. Refreshed with the latest." |
| Chain verified          | "Chain verified. No steps were altered."                               |
| Chain broken            | "Integrity check failed at step 4. Treat this case as unverified."     |

Amounts as `₦12,500.00`. Dates relative ("2h ago") with the absolute time on hover. IDs shortened to the last four characters with copy on click.

### Policy reasons, as analysts read them

| Code                           | Sentence                                               |
| ------------------------------ | ------------------------------------------------------ |
| `evidence_validation_failed`   | Some cited evidence could not be verified.             |
| `fraud_suspected`              | The agent suspects fraud.                              |
| `review_type`                  | This dispute type always needs a person to decide.     |
| `above_value_cap`              | The amount is above the auto-resolve limit.            |
| `rejection_needs_confirmation` | Rejections must be confirmed by an analyst.            |
| `agent_escalated`              | The agent chose to escalate.                           |
| `low_confidence`               | Confidence is below the auto-resolve threshold.        |
| `type_not_auto_eligible`       | This type isn't eligible for auto-resolution.          |
| `action_type_mismatch`         | The recommended action doesn't match the dispute type. |
| `insufficient_evidence`        | Not enough supporting evidence was gathered.           |
| `recommend_only_mode`          | The system is in recommend-only mode.                  |

---

## Accessibility and responsive

- WCAG 2.2 AA in both themes. Visible focus everywhere, logical tab order, skip link.
- Tables use real table markup; sortable headers announce their state.
- Dialogs trap and restore focus; Esc closes.
- Minimum hit target 32 px.
- Desktop first. Under 1100 px the case detail becomes tabs; under 768 px it is single column for viewing and approving.

## Checklist for every screen

- Tokens only; no hardcoded colours or off-scale spacing
- Light and dark both reviewed
- Loading, empty and error states
- Keyboard flow works end to end
- Numbers tabular and right-aligned in tables
- Customer text always escaped
- Model pill visible

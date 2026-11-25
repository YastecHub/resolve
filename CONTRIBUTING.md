# Contributing

How we work on resolve during the hackathon. Short on purpose: read it once before your first commit.

## Before you write code

- Read [RESOLVE.md](RESOLVE.md). It is the source of truth for behaviour. If code and RESOLVE.md disagree, fix one of them in the same pull request.
- UI work follows [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).
- Structure follows [ARCHITECTURE.md](ARCHITECTURE.md).

## Who owns what

| Area                                    | Owner         |
| --------------------------------------- | ------------- |
| `apps/web`                              | Ridwanullah   |
| `apps/api`                              | Yasir         |
| Agent, AI providers, infrastructure, CI | Oluwadarasimi |

Anyone can open a pull request anywhere. The owner reviews it.

## Branches and pull requests

- `main` deploys to Nobus automatically. Keep it green.
- Branch from `main`: `feat/agent-loop`, `fix/trace-polling`, `docs/readme-setup`.
- One change per pull request. Small is fast to review.
- The title follows the commit format below. The description says what changed and why in a few lines.
- Merge when CI passes and the owner has approved. Delete the branch after merging.

## Commits

[Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <description>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
- Scope is the area: `api`, `web`, `agent`, `policy`, `audit`, `db`, `ci`.
- Imperative, lower case, no full stop, under about 72 characters: `feat(policy): add value cap rule`.
- One logical change per commit. No `wip` commits on `main`.

## Code rules

1. **Money is integer kobo** (`amount_minor`). Never floats. Format with the shared naira formatter at the UI edge only.
2. **One source of types.** API request and response shapes are NestJS DTOs with Swagger decorators (`@ApiProperty`, `ApiSuccess`, `ApiFailure`), which produce `apps/api/openapi.json`. `packages/api-client` is generated from that file by Orval, and the web app gets every API type and hook from it. After changing a DTO or route, run `pnpm api:generate` and commit the result; CI fails if you forget. Never write API types by hand, and never hand-edit generated files.
3. **The model is untrusted.** Validate every model output with Zod. The policy engine decides, never the model.
4. **Untrusted text.** Customer notes, merchant names and counterparty names go inside `<untrusted>` tags in prompts. No tool takes free text from the model as a query.
5. **Audit is append-only.** No `UPDATE` or `DELETE` on `agent_steps`, `analyst_actions` or `access_events`. A test enforces it, and the app's database role has no permission to.
6. **Mask personal data** in every tool output (`****4821`). Never log prompts, tool outputs or customer notes.
7. **Model-agnostic.** Provider-specific code lives only in `apps/api/src/ai/`. Model names come from configuration.
8. **UI uses tokens only.** No hardcoded colours or off-scale spacing. Every screen has loading, empty and error states, works in light and dark, and is usable with a keyboard.
9. **No new dependency** without a one-line reason in the pull request.
10. **Keep comments for the why.** Don't restate what the code does.

## API conventions

- Every route is documented: `@ApiTags`, `@ApiOperation` with an `operationId`, `@ApiSuccess(Dto, …)` for the success shape, and `@ApiFailure(status, …)` for each error it can return.
- Controllers return plain data. The global interceptor wraps it as `{ success: true, data, meta }`; return `{ items, page, pageSize, total }` for paged lists and the pagination moves into `meta`.
- Throw `AppException` with a stable `code` for expected failures. The global filter turns every error into `{ success: false, error: { code, message, fieldErrors?, details? }, meta }`.
- Request bodies and queries are DTO classes with `class-validator` decorators. Unknown fields are rejected.

## Tests

Pure logic must have unit tests: the policy engine (one test per rule), the evidence validator, the hash chain (including a tamper test), money helpers, the executor (idempotency) and the provider adapter (with mocked `fetch`). The agent loop is tested with a scripted fake model. Every workspace uses Vitest; the API also has end-to-end tests (`pnpm --filter api test:e2e`).

## Definition of done

- The behaviour matches RESOLVE.md.
- Typecheck, lint and tests pass.
- Code is formatted with Prettier.
- UI changes are checked in both themes.
- No secrets, `.env` files or local notes in the commit.

## Secrets

Never commit keys, tokens, private keys or `.env` files. Use `.env.example` to document a variable and keep real values on the VM or in GitHub repository secrets.

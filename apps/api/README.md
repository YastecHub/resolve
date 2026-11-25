# api

The NestJS API and the investigation worker. Not scaffolded yet.

```
src/
  disputes/     intake, listing, detail, analyst actions, state machine
  investigations/  BullMQ processor that runs an investigation end to end
  agent/        agent loop, prompt, tools, evidence validator
  policy/       policy engine (pure)
  executor/     the only code that moves money
  audit/        hash-chained steps, verification, case files
  ai/           OpenAI-compatible provider adapter and model profiles
  auth/         sign-in, guards, roles
  config/       policy and AI settings, Redis cache
  metrics/      /metrics
  seed/         synthetic bank and demo cases
prisma/
  schema.prisma
  migrations/
```

Behaviour is specified in [RESOLVE.md](../../RESOLVE.md); structure and stack in [ARCHITECTURE.md](../../ARCHITECTURE.md).

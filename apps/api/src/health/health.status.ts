export type CheckStatus = 'up' | 'down';

export interface CheckResult {
  status: CheckStatus;
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  service: 'resolve-api';
  version: string;
  uptimeSeconds: number;
  time: string;
  checks: { api: CheckResult; database: CheckResult; redis: CheckResult };
}

export async function runCheck(
  probe: () => Promise<void>,
  timeoutMs: number,
): Promise<CheckResult> {
  const started = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      probe(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
    return { status: 'up', latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'unknown error',
    };
  } finally {
    clearTimeout(timer);
  }
}

export function overallStatus(checks: Record<string, CheckResult>): HealthReport['status'] {
  return Object.values(checks).every((check) => check.status === 'up') ? 'ok' : 'degraded';
}

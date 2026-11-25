import { overallStatus, runCheck } from './health.status.js';

describe('runCheck', () => {
  it('reports up when the probe resolves', async () => {
    const result = await runCheck(async () => {}, 100);
    expect(result.status).toBe('up');
    expect(result.error).toBeUndefined();
  });

  it('reports down with the error message when the probe rejects', async () => {
    const result = await runCheck(async () => {
      throw new Error('connection refused');
    }, 100);
    expect(result).toMatchObject({ status: 'down', error: 'connection refused' });
  });

  it('reports down when the probe exceeds the timeout', async () => {
    const result = await runCheck(() => new Promise(() => {}), 20);
    expect(result).toMatchObject({ status: 'down', error: 'timed out after 20 ms' });
  });
});

describe('overallStatus', () => {
  it('is ok only when every check is up', () => {
    const up = { status: 'up' as const, latencyMs: 1 };
    expect(overallStatus({ a: up, b: up })).toBe('ok');
    expect(overallStatus({ a: up, b: { status: 'down', latencyMs: 1 } })).toBe('degraded');
  });
});

import {
  OpenAiCompatibleProvider,
  parseToolArguments,
  ProviderError,
} from './openai-compatible.js';
import type { AiProfile } from './types.js';

const profile: AiProfile = {
  name: 'hosted',
  label: 'Hosted',
  kind: 'hosted',
  baseUrl: 'https://models.example/v1/',
  model: 'test-model',
  timeoutMs: 50,
};

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

const completion = {
  model: 'test-model',
  choices: [
    {
      message: {
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            function: { name: 'get_transaction', arguments: '{"transaction_id":"txn_1"}' },
          },
        ],
      },
    },
  ],
  usage: { prompt_tokens: 120, completion_tokens: 15 },
};

function provider(fetchImpl: typeof fetch, sleep = vi.fn(async () => {})) {
  return {
    sleep,
    adapter: new OpenAiCompatibleProvider(profile, { apiKey: 'secret', fetch: fetchImpl, sleep }),
  };
}

describe('OpenAiCompatibleProvider', () => {
  it('sends an OpenAI-style request and parses tool calls and usage', async () => {
    const fetchMock = vi.fn(async () => json(completion));
    const { adapter } = provider(fetchMock as unknown as typeof fetch);
    const res = await adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      tools: [{ name: 'get_transaction', description: 'd', parameters: { type: 'object' } }],
      toolChoice: { name: 'get_transaction' },
    });

    expect(res).toEqual({
      content: null,
      toolCalls: [
        { id: 'call_1', name: 'get_transaction', arguments: { transaction_id: 'txn_1' } },
      ],
      usage: { input: 120, output: 15 },
      rawModel: 'test-model',
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://models.example/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      model: 'test-model',
      temperature: 0.1,
      max_tokens: 1500,
      tool_choice: { type: 'function', function: { name: 'get_transaction' } },
      tools: [{ type: 'function', function: { name: 'get_transaction' } }],
    });
  });

  it('turns malformed tool arguments into a parse error for the loop', async () => {
    const broken = structuredClone(completion);
    broken.choices[0]!.message.tool_calls[0]!.function.arguments = '{"transaction_id": ';
    const { adapter } = provider((async () => json(broken)) as unknown as typeof fetch);
    const res = await adapter.chat({ messages: [] });
    expect(res.toolCalls[0]!.arguments).toEqual({
      __parse_error: true,
      raw: '{"transaction_id": ',
    });
  });

  it('retries a 429, honouring Retry-After', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ error: 'slow down' }, 429, { 'retry-after': '2' }))
      .mockResolvedValueOnce(json(completion));
    const { adapter, sleep } = provider(fetchMock as unknown as typeof fetch);
    await adapter.chat({ messages: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('gives up after two retries on 5xx', async () => {
    const fetchMock = vi.fn(async () => json({}, 503));
    const { adapter, sleep } = provider(fetchMock as unknown as typeof fetch);
    await expect(adapter.chat({ messages: [] })).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);
  });

  it('does not retry a 400', async () => {
    const fetchMock = vi.fn(async () => json({}, 400));
    const { adapter } = provider(fetchMock as unknown as typeof fetch);
    await expect(adapter.chat({ messages: [] })).rejects.toBeInstanceOf(ProviderError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('times out a request that hangs', async () => {
    const hang = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const { adapter } = provider(hang as unknown as typeof fetch);
    await expect(adapter.chat({ messages: [] })).rejects.toThrow('did not answer within 50 ms');
    expect(hang).toHaveBeenCalledTimes(3);
  });
});

describe('parseToolArguments', () => {
  it('strips code fences', () => {
    expect(parseToolArguments('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('treats empty arguments as an empty object', () => {
    expect(parseToolArguments('')).toEqual({});
    expect(parseToolArguments(undefined)).toEqual({});
  });

  it('passes objects through', () => {
    expect(parseToolArguments({ a: 1 })).toEqual({ a: 1 });
  });
});

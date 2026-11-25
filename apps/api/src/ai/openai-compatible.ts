import type {
  AiProfile,
  ChatProvider,
  ChatRequest,
  ChatResponse,
  Message,
  ToolCall,
} from './types.js';

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export interface AdapterOptions {
  apiKey?: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  baseDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/** Parses tool-call arguments the way models actually send them: sometimes fenced, sometimes broken. */
export function parseToolArguments(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw ?? {};
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  if (stripped === '') return {};
  try {
    return JSON.parse(stripped);
  } catch {
    return { __parse_error: true, raw };
  }
}

function toWireMessage(message: Message): Record<string, unknown> {
  switch (message.role) {
    case 'tool':
      return { role: 'tool', tool_call_id: message.toolCallId, content: message.content };
    case 'assistant':
      return {
        role: 'assistant',
        content: message.content,
        ...(message.toolCalls?.length
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: 'function',
                function: { name: call.name, arguments: JSON.stringify(call.arguments ?? {}) },
              })),
            }
          : {}),
      };
    default:
      return { role: message.role, content: message.content };
  }
}

interface WireResponse {
  model?: string;
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: { id?: string; function?: { name?: string; arguments?: unknown } }[];
    };
  }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function retryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

export class OpenAiCompatibleProvider implements ChatProvider {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(
    private readonly profile: AiProfile,
    private readonly options: AdapterOptions = {},
  ) {
    this.fetchImpl = options.fetch ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.maxRetries = options.maxRetries ?? 2;
    this.baseDelayMs = options.baseDelayMs ?? 1_000;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const body = {
      model: this.profile.model,
      messages: request.messages.map(toWireMessage),
      temperature: request.temperature ?? 0.1,
      max_tokens: request.maxTokens ?? 1500,
      ...(request.tools?.length
        ? {
            tools: request.tools.map((tool) => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
            tool_choice:
              request.toolChoice && request.toolChoice !== 'auto'
                ? { type: 'function', function: { name: request.toolChoice.name } }
                : 'auto',
          }
        : {}),
    };

    let attempt = 0;
    for (;;) {
      try {
        return await this.once(body);
      } catch (error) {
        const retryable = error instanceof ProviderError && error.retryable;
        if (!retryable || attempt >= this.maxRetries) throw error;
        const hinted = (error as ProviderError & { retryAfterMs?: number }).retryAfterMs;
        await this.sleep(hinted ?? this.baseDelayMs * 2 ** attempt);
        attempt++;
      }
    }
  }

  private async once(body: Record<string, unknown>): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutMs = this.profile.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(
        `${this.profile.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );
    } catch (error) {
      const timedOut = controller.signal.aborted;
      throw new ProviderError(
        timedOut
          ? `The model did not answer within ${timeoutMs} ms.`
          : `Could not reach the model: ${error instanceof Error ? error.message : 'network error'}`,
        undefined,
        true,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      const error = new ProviderError(
        `The model returned HTTP ${response.status}.`,
        response.status,
        retryable,
      ) as ProviderError & { retryAfterMs?: number };
      const hinted = retryAfterMs(response.headers.get('retry-after'));
      if (hinted !== null) error.retryAfterMs = Math.min(hinted, 30_000);
      throw error;
    }

    const json = (await response.json()) as WireResponse;
    const message = json.choices?.[0]?.message ?? {};
    const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((call, index) => ({
      id: call.id ?? `call_${index}`,
      name: call.function?.name ?? '',
      arguments: parseToolArguments(call.function?.arguments),
    }));
    return {
      content: message.content ?? null,
      toolCalls,
      usage: json.usage
        ? { input: json.usage.prompt_tokens ?? 0, output: json.usage.completion_tokens ?? 0 }
        : undefined,
      rawModel: json.model,
    };
  }
}

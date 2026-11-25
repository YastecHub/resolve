export type Message =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      toolCalls?: { id: string; name: string; arguments: unknown; extraContent?: unknown }[];
    }
  | { role: 'tool'; toolCallId: string; content: string };

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  messages: Message[];
  tools?: ToolDef[];
  toolChoice?: 'auto' | { name: string };
  maxTokens?: number;
  temperature?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
  extraContent?: unknown;
}

export interface ChatResponse {
  content: string | null;
  toolCalls: ToolCall[];
  usage?: { input: number; output: number };
  rawModel?: string;
}

export interface ChatProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}

export interface AiProfile {
  name: string;
  label: string;
  kind: string;
  baseUrl: string;
  model: string;
  timeoutMs?: number;
}

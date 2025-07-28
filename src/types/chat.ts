
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
}

export const AVAILABLE_MODELS = [
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
  { value: 'openai/gpt-4.1', label: 'OpenAI GPT-4.1' },
  { value: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4' },
  { value: 'anthropic/claude-opus-4', label: 'Anthropic Claude Opus 4' },
  { value: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Google Gemini 2.5 Pro' },
  { value: 'x-ai/grok-4', label: 'xAI Grok 4' },
  { value: 'moonshotai/kimi-k2', label: 'MoonshotAI Kimi K2' },
] as const;

export type ModelType = typeof AVAILABLE_MODELS[number]['value'];

export interface WebhookPayload {
  message: string;
  model: string;
  sessionID: string;
  prompt: string;
  admin_email: string;
}

export interface WebhookResponse {
  output: string;
}

export interface TranscriptionResponse {
  transcription: string;
}

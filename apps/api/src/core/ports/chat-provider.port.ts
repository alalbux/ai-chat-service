export type LlmCompletion = {
  text: string;
  provider: 'openrouter' | 'gemini' | 'mock';
  model: string | null;
};

export interface ChatProvider {
  complete(prompt: string): Promise<LlmCompletion>;
}

export const CHAT_PROVIDER = Symbol('CHAT_PROVIDER');

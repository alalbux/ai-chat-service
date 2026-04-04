import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type LlmCompletion = {
  text: string;
  provider: 'openrouter' | 'gemini' | 'mock';
  model: string | null;
};

@Injectable()
export class LlmService {
  private readonly log = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  async complete(prompt: string): Promise<LlmCompletion> {
    const mock = this.config.get<string>('LLM_MOCK');
    if (mock === '1' || mock === 'true') {
      return {
        text: `[mock] Echo: ${prompt.slice(0, 500)}`,
        provider: 'mock',
        model: null,
      };
    }

    const openRouterErr = await this.tryOpenRouter(prompt);
    if (openRouterErr.result) {
      return openRouterErr.result;
    }

    const geminiErr = await this.tryGemini(prompt);
    if (geminiErr.result) {
      return geminiErr.result;
    }

    this.log.warn(
      `LLM failover exhausted: openrouter=${openRouterErr.message} gemini=${geminiErr.message}`,
    );
    throw new ServiceUnavailableException({
      message: 'LLM providers unavailable',
      errors: [
        { provider: 'openrouter', detail: openRouterErr.message },
        { provider: 'gemini', detail: geminiErr.message },
      ],
    });
  }

  private async tryOpenRouter(
    prompt: string,
  ): Promise<{ result?: LlmCompletion; message: string }> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    const model = this.config.get<string>('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini';
    if (!apiKey) {
      return { message: 'OPENROUTER_API_KEY not set' };
    }

    const siteUrl = this.config.get<string>('OPENROUTER_SITE_URL') ?? 'https://localhost';
    const appName = this.config.get<string>('OPENROUTER_APP_NAME') ?? 'rt-chat-api';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': siteUrl,
          'X-Title': appName,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { message: `OpenRouter HTTP ${res.status}: ${body.slice(0, 500)}` };
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        return { message: 'OpenRouter returned empty content' };
      }
      return { result: { text, provider: 'openrouter', model }, message: 'ok' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { message: `OpenRouter error: ${msg}` };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async tryGemini(prompt: string): Promise<{ result?: LlmCompletion; message: string }> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const modelName = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';
    if (!apiKey) {
      return { message: 'GEMINI_API_KEY not set' };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();
      if (!text) {
        return { message: 'Gemini returned empty content' };
      }
      return { result: { text, provider: 'gemini', model: modelName }, message: 'ok' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { message: `Gemini error: ${msg}` };
    }
  }
}

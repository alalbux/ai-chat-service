jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';

const MockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('LlmService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    MockGoogleGenerativeAI.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const makeConfig = (values: Record<string, string | undefined>) => {
    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  };

  it('complete returns mock echo when LLM_MOCK is 1', async () => {
    // Arrange
    const config = makeConfig({ LLM_MOCK: '1' });
    const service = new LlmService(config);
    const prompt = 'hello world';

    // Act
    const result = await service.complete(prompt);

    // Assert
    expect(result.provider).toBe('mock');
    expect(result.model).toBeNull();
    expect(result.text).toBe('[mock] Echo: hello world');
  });

  it('complete returns mock echo when LLM_MOCK is true', async () => {
    // Arrange
    const config = makeConfig({ LLM_MOCK: 'true' });
    const service = new LlmService(config);

    // Act
    const result = await service.complete('ping');

    // Assert
    expect(result.provider).toBe('mock');
    expect(result.text).toContain('ping');
  });

  it('complete truncates mock echo at 500 chars', async () => {
    // Arrange
    const config = makeConfig({ LLM_MOCK: '1' });
    const service = new LlmService(config);
    const long = 'a'.repeat(600);

    // Act
    const result = await service.complete(long);

    // Assert
    expect(result.text).toBe(`[mock] Echo: ${'a'.repeat(500)}`);
  });

  it('complete throws ServiceUnavailableException when no providers and not mock', async () => {
    // Arrange
    const config = makeConfig({
      LLM_MOCK: undefined,
      OPENROUTER_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
    });
    const service = new LlmService(config);

    // Act
    let caught: unknown;
    try {
      await service.complete('any');
    } catch (e) {
      caught = e;
    }

    // Assert
    expect(caught).toBeInstanceOf(ServiceUnavailableException);
    const body = (caught as ServiceUnavailableException).getResponse() as {
      message: string;
      errors: Array<{ provider: string; detail: string }>;
    };
    expect(body.message).toBe('LLM providers unavailable');
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: 'openrouter' }),
        expect.objectContaining({ provider: 'gemini' }),
      ]),
    );
  });

  describe('OpenRouter', () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('complete returns OpenRouter result on HTTP 200 with content', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '  answer  ' } }],
        }),
      });
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: 'sk-or',
        OPENROUTER_MODEL: 'x/y',
      });
      const service = new LlmService(config);

      // Act
      const result = await service.complete('question');

      // Assert
      expect(result).toEqual({
        text: 'answer',
        provider: 'openrouter',
        model: 'x/y',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-or',
          }),
        }),
      );
    });

    it('complete falls back when OpenRouter returns non-OK', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'rate limit',
      });
      MockGoogleGenerativeAI.mockImplementation(
        () =>
          ({
            getGenerativeModel: jest.fn().mockReturnValue({
              generateContent: jest.fn().mockResolvedValue({
                response: { text: () => 'from gemini' },
              }),
            }),
          }) as unknown as InstanceType<typeof GoogleGenerativeAI>,
      );
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: 'sk',
        GEMINI_API_KEY: 'gk',
      });
      const service = new LlmService(config);

      // Act
      const result = await service.complete('q');

      // Assert
      expect(result.provider).toBe('gemini');
      expect(result.text).toBe('from gemini');
    });

    it('complete uses empty body snippet when error response text() throws', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockRejectedValue(new Error('read failed')),
      });
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: 'sk',
        GEMINI_API_KEY: undefined,
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('q');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'openrouter')?.detail).toMatch(
        /OpenRouter HTTP 500/,
      );
    });

    it('complete maps non-Error OpenRouter failure to string detail', async () => {
      // Arrange
      global.fetch = jest.fn().mockRejectedValue('not-an-error');
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: 'sk',
        GEMINI_API_KEY: undefined,
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('q');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'openrouter')?.detail).toContain(
        'OpenRouter error',
      );
    });

    it('complete records OpenRouter error message when fetch throws', async () => {
      // Arrange
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: 'sk',
        GEMINI_API_KEY: undefined,
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('q');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'openrouter')?.detail).toContain(
        'OpenRouter error',
      );
    });

    it('complete returns empty-content message when choices lack text', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '   ' } }] }),
      });
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: 'sk',
        GEMINI_API_KEY: undefined,
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('q');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'openrouter')?.detail).toContain(
        'empty content',
      );
    });
  });

  describe('Gemini', () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('complete returns Gemini when OpenRouter has no key', async () => {
      // Arrange
      MockGoogleGenerativeAI.mockImplementation(
        () =>
          ({
            getGenerativeModel: jest.fn().mockReturnValue({
              generateContent: jest.fn().mockResolvedValue({
                response: { text: () => '  g  ' },
              }),
            }),
          }) as unknown as InstanceType<typeof GoogleGenerativeAI>,
      );
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: undefined,
        GEMINI_API_KEY: 'gk',
        GEMINI_MODEL: 'gemini-pro',
      });
      const service = new LlmService(config);

      // Act
      const result = await service.complete('hi');

      // Assert
      expect(result).toEqual({
        text: 'g',
        provider: 'gemini',
        model: 'gemini-pro',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('complete returns Gemini error detail when generateContent throws', async () => {
      // Arrange
      MockGoogleGenerativeAI.mockImplementation(
        () =>
          ({
            getGenerativeModel: jest.fn().mockReturnValue({
              generateContent: jest.fn().mockRejectedValue(new Error('quota')),
            }),
          }) as unknown as InstanceType<typeof GoogleGenerativeAI>,
      );
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: undefined,
        GEMINI_API_KEY: 'gk',
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('hi');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'gemini')?.detail).toContain('Gemini error');
    });

    it('complete returns empty content when Gemini text is blank', async () => {
      // Arrange
      MockGoogleGenerativeAI.mockImplementation(
        () =>
          ({
            getGenerativeModel: jest.fn().mockReturnValue({
              generateContent: jest.fn().mockResolvedValue({
                response: { text: () => '   ' },
              }),
            }),
          }) as unknown as InstanceType<typeof GoogleGenerativeAI>,
      );
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: undefined,
        GEMINI_API_KEY: 'gk',
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('hi');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'gemini')?.detail).toContain('empty content');
    });

    it('complete maps non-Error Gemini failure to string detail', async () => {
      // Arrange
      MockGoogleGenerativeAI.mockImplementation(
        () =>
          ({
            getGenerativeModel: jest.fn().mockReturnValue({
              generateContent: jest.fn().mockRejectedValue('weird'),
            }),
          }) as unknown as InstanceType<typeof GoogleGenerativeAI>,
      );
      const config = makeConfig({
        LLM_MOCK: undefined,
        OPENROUTER_API_KEY: undefined,
        GEMINI_API_KEY: 'gk',
      });
      const service = new LlmService(config);

      // Act
      let caught: unknown;
      try {
        await service.complete('hi');
      } catch (e) {
        caught = e;
      }

      // Assert
      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      const body = (caught as ServiceUnavailableException).getResponse() as {
        errors: Array<{ provider: string; detail: string }>;
      };
      expect(body.errors.find((x) => x.provider === 'gemini')?.detail).toContain('Gemini error');
    });
  });
});

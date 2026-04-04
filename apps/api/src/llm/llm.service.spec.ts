import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
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
});

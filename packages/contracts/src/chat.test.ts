import { ChatCreateBodySchema, ChatRecordSchema } from './chat';

describe('ChatCreateBodySchema', () => {
  it('accepts valid body', () => {
    // Arrange
    const input = { userId: 'u1', prompt: 'hi' };

    // Act
    const r = ChatCreateBodySchema.parse(input);

    // Assert
    expect(r).toEqual({ userId: 'u1', prompt: 'hi' });
  });

  it('rejects empty prompt', () => {
    // Arrange
    const input = { userId: 'u1', prompt: '' };

    // Act
    const act = () => ChatCreateBodySchema.parse(input);

    // Assert
    expect(act).toThrow();
  });
});

describe('ChatRecordSchema', () => {
  it('accepts ISO datetimes', () => {
    // Arrange
    const input = {
      id: 'c1',
      userId: 'u1',
      prompt: 'hi',
      response: 'hello',
      model: null,
      timestamp: '2026-01-01T00:00:00.000Z',
      provider: 'mock' as const,
    };

    // Act
    const r = ChatRecordSchema.parse(input);

    // Assert
    expect(r.provider).toBe('mock');
    expect(r.response).toBe('hello');
  });
});

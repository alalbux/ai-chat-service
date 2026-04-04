import { ChatCreateBodySchema, ChatRecordSchema } from './chat';

describe('ChatCreateBodySchema', () => {
  it('accepts valid body', () => {
    const r = ChatCreateBodySchema.parse({ userId: 'u1', prompt: 'hi' });
    expect(r).toEqual({ userId: 'u1', prompt: 'hi' });
  });

  it('rejects empty prompt', () => {
    expect(() => ChatCreateBodySchema.parse({ userId: 'u1', prompt: '' })).toThrow();
  });
});

describe('ChatRecordSchema', () => {
  it('accepts ISO datetimes', () => {
    const r = ChatRecordSchema.parse({
      id: 'c1',
      userId: 'u1',
      prompt: 'hi',
      response: 'hello',
      model: null,
      timestamp: '2026-01-01T00:00:00.000Z',
      provider: 'mock',
    });
    expect(r.provider).toBe('mock');
    expect(r.response).toBe('hello');
  });
});

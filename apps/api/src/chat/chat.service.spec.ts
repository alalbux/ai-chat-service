import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const prisma = {
    chat: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const llm = {
    complete: jest.fn(),
  } as unknown as LlmService;

  const service = new ChatService(prisma, llm);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create persists llm output and maps to public contract', async () => {
    // Arrange
    llm.complete = jest.fn().mockResolvedValue({
      text: 'hi',
      provider: 'mock',
      model: null,
    });
    prisma.chat.create = jest.fn().mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      prompt: 'yo',
      reply: 'hi',
      provider: 'mock',
      model: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    // Act
    const out = await service.create({ userId: 'u1', prompt: 'yo' });

    // Assert
    expect(out.response).toBe('hi');
    expect(out.timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(out.provider).toBe('mock');
    expect(llm.complete).toHaveBeenCalledWith('yo');
    expect(prisma.chat.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        prompt: 'yo',
        reply: 'hi',
        provider: 'mock',
        model: null,
      },
    });
  });

  it('parseCreateBody throws BadRequestException when validation fails', () => {
    // Arrange
    const invalidBody = { userId: '', prompt: 'x' };

    // Act
    const act = () => service.parseCreateBody(invalidBody);

    // Assert
    expect(act).toThrow(BadRequestException);
  });

  it('parseCreateBody attaches Zod issues to BadRequest response', () => {
    // Arrange
    const invalidBody = { userId: '', prompt: 'x' };

    // Act
    try {
      service.parseCreateBody(invalidBody);
      throw new Error('expected BadRequestException');
    } catch (e) {
      // Assert
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toMatchObject({
        message: 'Validation failed',
      });
      const body = (e as BadRequestException).getResponse() as { issues: unknown[] };
      expect(Array.isArray(body.issues)).toBe(true);
      expect(body.issues.length).toBeGreaterThan(0);
    }
  });

  it('findById returns mapped record when row exists', async () => {
    // Arrange
    prisma.chat.findUnique = jest.fn().mockResolvedValue({
      id: 'c2',
      userId: 'u2',
      prompt: 'q',
      reply: 'a',
      provider: 'openrouter',
      model: 'm',
      createdAt: new Date('2026-06-15T14:32:00.000Z'),
      updatedAt: new Date('2026-06-15T14:32:00.000Z'),
    });

    // Act
    const out = await service.findById('c2');

    // Assert
    expect(out.id).toBe('c2');
    expect(out.response).toBe('a');
    expect(out.timestamp).toBe('2026-06-15T14:32:00.000Z');
    expect(out.provider).toBe('openrouter');
    expect(out.model).toBe('m');
    expect(prisma.chat.findUnique).toHaveBeenCalledWith({ where: { id: 'c2' } });
  });

  it('findById throws NotFoundException when row is missing', async () => {
    // Arrange
    prisma.chat.findUnique = jest.fn().mockResolvedValue(null);

    // Act
    const promise = service.findById('nope');

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
  });
});

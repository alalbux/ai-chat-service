import { NotFoundException } from '@nestjs/common';
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

  it('create persists llm output', async () => {
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

    const out = await service.create({ userId: 'u1', prompt: 'yo' });
    expect(out.reply).toBe('hi');
    expect(out.provider).toBe('mock');
    expect(llm.complete).toHaveBeenCalledWith('yo');
  });

  it('findById throws when missing', async () => {
    prisma.chat.findUnique = jest.fn().mockResolvedValue(null);
    await expect(service.findById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});

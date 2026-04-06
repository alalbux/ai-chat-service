import { ChatCreateBodySchema, ChatRecord, type ChatCreateBody } from '@ai-chat/contracts';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ZodError } from 'zod';
import { CHAT_PROVIDER, ChatProvider } from '../core/ports/chat-provider.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CHAT_PROVIDER) private readonly llm: ChatProvider,
  ) {}

  parseCreateBody(body: unknown): ChatCreateBody {
    try {
      return ChatCreateBodySchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException({ message: 'Validation failed', issues: e.issues });
      }
      throw e;
    }
  }

  async create(body: unknown): Promise<ChatRecord> {
    const parsed = this.parseCreateBody(body);
    const completion = await this.llm.complete(parsed.prompt);

    const row = await this.prisma.chat.create({
      data: {
        userId: parsed.userId,
        prompt: parsed.prompt,
        reply: completion.text,
        provider: completion.provider,
        model: completion.model,
      },
    });

    return this.toRecord(row);
  }

  async findById(id: string): Promise<ChatRecord> {
    const row = await this.prisma.chat.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({ message: 'Chat not found', id });
    }
    return this.toRecord(row);
  }

  private toRecord(row: {
    id: string;
    userId: string;
    prompt: string;
    reply: string;
    provider: string;
    model: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ChatRecord {
    const provider = row.provider as ChatRecord['provider'];
    if (provider !== 'openrouter' && provider !== 'gemini' && provider !== 'mock') {
      throw new Error(`Invalid provider persisted: ${row.provider}`);
    }
    return {
      id: row.id,
      userId: row.userId,
      prompt: row.prompt,
      response: row.reply,
      model: row.model,
      timestamp: row.createdAt.toISOString(),
      provider,
    };
  }
}

import { z } from 'zod';

export const ChatCreateBodySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  prompt: z.string().min(1, 'prompt is required'),
});

export type ChatCreateBody = z.infer<typeof ChatCreateBodySchema>;

export const ChatRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string(),
  response: z.string(),
  model: z.string().nullable(),
  timestamp: z.string().datetime(),
  provider: z.enum(['openrouter', 'gemini', 'mock']),
});

export type ChatRecord = z.infer<typeof ChatRecordSchema>;

export const ChatCreateResponseSchema = ChatRecordSchema;

export type ChatCreateResponse = z.infer<typeof ChatCreateResponseSchema>;

export const ChatGetParamsSchema = z.object({
  id: z.string().min(1),
});

export type ChatGetParams = z.infer<typeof ChatGetParamsSchema>;

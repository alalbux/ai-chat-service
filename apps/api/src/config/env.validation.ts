import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  API_GLOBAL_PREFIX: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LLM_MOCK: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().optional(),
  OPENROUTER_APP_NAME: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  DD_TRACE_ENABLED: z.string().optional(),
  DD_AGENT_HOST: z.string().optional(),
  DD_TRACE_AGENT_PORT: z.coerce.number().int().positive().optional(),
  DD_SERVICE: z.string().optional(),
  DD_ENV: z.string().optional(),
  DD_VERSION: z.string().optional(),
  DD_LOGS_INJECTION: z.string().optional(),
  DD_TRACE_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return parsed.data;
}

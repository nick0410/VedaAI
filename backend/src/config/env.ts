import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/assessment_creator',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me-' + Math.random().toString(36).slice(2),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  llm: {
    provider: (process.env.LLM_PROVIDER ?? 'mock') as 'mock' | 'openai' | 'anthropic' | 'groq',
    openaiKey: process.env.OPENAI_API_KEY ?? '',
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    anthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
    anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    groqKey: process.env.GROQ_API_KEY ?? '',
    groqModel: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
  },
};

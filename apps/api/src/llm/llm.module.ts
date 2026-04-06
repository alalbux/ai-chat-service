import { Module } from '@nestjs/common';
import { CHAT_PROVIDER } from '../core/ports/chat-provider.port';
import { LlmService } from './llm.service';

@Module({
  providers: [
    LlmService,
    {
      provide: CHAT_PROVIDER,
      useExisting: LlmService,
    },
  ],
  exports: [CHAT_PROVIDER],
})
export class LlmModule {}

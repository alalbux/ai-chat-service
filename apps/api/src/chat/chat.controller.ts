import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

const chatCreateExample = {
  userId: '12345',
  prompt: 'Como está a cotação do dólar hoje?',
};

const chatRecordExample = {
  id: 'abcde-12345',
  userId: '12345',
  prompt: 'Como está a cotação do dólar hoje?',
  response: 'A cotação do dólar hoje é R$5,10.',
  model: 'gpt-4',
  timestamp: '2024-06-15T14:32:00.000Z',
  provider: 'openrouter',
};

@ApiTags('chat')
@Controller({ version: '1' })
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('chat')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create chat completion and persist',
    description:
      'Aligns with the engineering challenge: POST /v1/chat with userId + prompt. The `provider` field extends the sample response for observability (which LLM path was used).',
  })
  @ApiBody({
    description: 'Request body (challenge Part 1)',
    examples: { challenge: { summary: 'PDF example', value: chatCreateExample } },
  })
  @ApiCreatedResponse({
    description:
      'Persisted row and LLM output. Field names match the challenge (`response`, `timestamp`); `provider` is an extra.',
    schema: { example: chatRecordExample },
  })
  create(@Body() body: unknown) {
    return this.chat.create(body);
  }

  @Get('chats/:id')
  @ApiOperation({ summary: 'Get persisted chat by id' })
  @ApiOkResponse({
    description: 'Same shape as POST /v1/chat response',
    schema: { example: chatRecordExample },
  })
  findOne(@Param('id') id: string) {
    return this.chat.findById(id);
  }
}

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller({ version: '1' })
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Create chat completion and persist' })
  create(@Body() body: unknown) {
    return this.chat.create(body);
  }

  @Get('chats/:id')
  @ApiOperation({ summary: 'Get persisted chat by id' })
  findOne(@Param('id') id: string) {
    return this.chat.findById(id);
  }
}

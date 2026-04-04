import type { ChatRecord } from '@ai-chat/contracts';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chat: jest.Mocked<Pick<ChatService, 'create' | 'findById'>>;

  beforeEach(() => {
    chat = {
      create: jest.fn(),
      findById: jest.fn(),
    };
    controller = new ChatController(chat as unknown as ChatService);
  });

  it('create delegates to ChatService', async () => {
    // Arrange
    const record: ChatRecord = {
      id: 'id1',
      userId: 'u1',
      prompt: 'p',
      response: 'r',
      model: null,
      timestamp: '2026-01-01T00:00:00.000Z',
      provider: 'mock',
    };
    chat.create.mockResolvedValue(record);
    const body = { userId: 'u1', prompt: 'p' };

    // Act
    const out = await controller.create(body);

    // Assert
    expect(out).toEqual(record);
    expect(chat.create).toHaveBeenCalledWith(body);
  });

  it('findOne delegates to ChatService', async () => {
    // Arrange
    const record: ChatRecord = {
      id: 'id1',
      userId: 'u1',
      prompt: 'p',
      response: 'r',
      model: 'm',
      timestamp: '2026-01-01T00:00:00.000Z',
      provider: 'gemini',
    };
    chat.findById.mockResolvedValue(record);

    // Act
    const out = await controller.findOne('id1');

    // Assert
    expect(out).toEqual(record);
    expect(chat.findById).toHaveBeenCalledWith('id1');
  });
});

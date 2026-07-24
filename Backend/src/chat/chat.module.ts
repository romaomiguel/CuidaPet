import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  // BookingsService chama createSystemMessage() diretamente no aceite do booking.
  exports: [ChatService],
})
export class ChatModule {}

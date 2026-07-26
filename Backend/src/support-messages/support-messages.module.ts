import { Module } from '@nestjs/common';
import { SupportMessagesService } from './support-messages.service';
import { SupportMessagesController } from './support-messages.controller';

@Module({
  controllers: [SupportMessagesController],
  providers: [SupportMessagesService],
})
export class SupportMessagesModule {}

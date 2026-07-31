import { Module } from '@nestjs/common';
import { ServiceSuggestionsService } from './service-suggestions.service';
import { ServiceSuggestionsController } from './service-suggestions.controller';

@Module({
  controllers: [ServiceSuggestionsController],
  providers: [ServiceSuggestionsService],
})
export class ServiceSuggestionsModule {}

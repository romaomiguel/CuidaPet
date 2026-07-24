import { Module } from '@nestjs/common';
import { LocationCheckInsService } from './location-checkins.service';
import { LocationCheckInsController } from './location-checkins.controller';

@Module({
  controllers: [LocationCheckInsController],
  providers: [LocationCheckInsService],
})
export class LocationCheckInsModule {}

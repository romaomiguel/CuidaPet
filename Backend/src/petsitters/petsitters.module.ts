import { Module } from '@nestjs/common';
import { PetsittersService } from './petsitters.service';
import { PetsittersController } from './petsitters.controller';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [PetsittersController],
  providers: [PetsittersService],
  exports: [PetsittersService],
})
export class PetsittersModule {}

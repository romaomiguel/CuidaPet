import { Module } from '@nestjs/common';
import { PetsittersService } from './petsitters.service';
import { PetsittersController } from './petsitters.controller';

@Module({
  controllers: [PetsittersController],
  providers: [PetsittersService],
  exports: [PetsittersService],
})
export class PetsittersModule {}

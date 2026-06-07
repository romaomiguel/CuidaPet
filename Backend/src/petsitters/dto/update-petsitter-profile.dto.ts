import { PartialType } from '@nestjs/swagger';
import { CreatePetsitterProfileDto } from './create-petsitter-profile.dto';

export class UpdatePetsitterProfileDto extends PartialType(
  CreatePetsitterProfileDto,
) {}


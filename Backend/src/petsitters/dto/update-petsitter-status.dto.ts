import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const PETSITTER_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PetsitterStatus = (typeof PETSITTER_STATUSES)[number];

export class UpdatePetsitterStatusDto {
  @ApiProperty({ enum: PETSITTER_STATUSES, description: 'Novo status do petsitter' })
  @IsEnum(PETSITTER_STATUSES, {
    message: `status deve ser um de: ${PETSITTER_STATUSES.join(', ')}`,
  })
  status: PetsitterStatus;
}

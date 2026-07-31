import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const SERVICE_SUGGESTION_STATUSES = ['pending', 'reviewed'] as const;
export type ServiceSuggestionStatus = (typeof SERVICE_SUGGESTION_STATUSES)[number];

export class UpdateServiceSuggestionStatusDto {
  @ApiProperty({ enum: SERVICE_SUGGESTION_STATUSES })
  @IsIn(SERVICE_SUGGESTION_STATUSES, {
    message: `status deve ser um de: ${SERVICE_SUGGESTION_STATUSES.join(', ')}`,
  })
  status: ServiceSuggestionStatus;
}

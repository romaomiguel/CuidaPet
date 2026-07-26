import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSupportMessageDto {
  @ApiProperty({ description: 'Marca a mensagem como resolvida (true) ou reabre (false)' })
  @IsBoolean()
  resolved: boolean;
}

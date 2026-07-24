import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'A mensagem não pode ter mais de 2000 caracteres' })
  content: string;
}

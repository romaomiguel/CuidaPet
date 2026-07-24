import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID do petsitter sendo avaliado' })
  @IsString()
  @IsNotEmpty()
  petsitterId: string;

  @ApiProperty({ description: 'ID do agendamento' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Nota (rating) de 1 a 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário sobre o serviço' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'O comentário não pode ter mais de 500 caracteres' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Tags fixas selecionadas (conjunto fechado por nota)', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];
}

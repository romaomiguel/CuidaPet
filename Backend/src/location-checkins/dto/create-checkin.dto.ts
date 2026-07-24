import { IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckInDto {
  @ApiProperty({ description: 'Latitude do check-in' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ description: 'Longitude do check-in' })
  @IsLongitude()
  longitude: number;
}

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LocationCheckInsService } from './location-checkins.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

// GET sem @Roles — validação de dono (só o tutor do booking) é feita no service,
// mesmo padrão do ChatController.
@ApiTags('location-checkins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings/:bookingId/location-checkins')
export class LocationCheckInsController {
  constructor(private readonly locationCheckInsService: LocationCheckInsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('petsitter')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Petsitter envia um check-in de localização durante o serviço' })
  create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCheckInDto,
  ) {
    return this.locationCheckInsService.create(bookingId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tutor lista o trajeto (check-ins) de um agendamento' })
  list(@Param('bookingId') bookingId: string, @CurrentUser() user: { id: string }) {
    return this.locationCheckInsService.list(bookingId, user.id);
  }
}

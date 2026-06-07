import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles('tutor')
  @ApiOperation({ summary: 'Criar uma solicitação de agendamento' })
  create(
    @CurrentUser() user: { id: string },
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user.id, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos do usuário logado' })
  async findAll(@CurrentUser() user: { id: string; role: string }) {
    const data = await this.bookingsService.findAll(user.id, user.role);
    return { data };
  }

  @Get('petsitter/:id/busy-slots')
  @ApiOperation({ summary: 'Obter horários ocupados de um petsitter' })
  async getBusySlots(@Param('id') id: string) {
    return this.bookingsService.getBusySlots(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar um agendamento' })
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.bookingsService.cancel(id, user.id);
  }

  @Patch(':id/accept')
  @Roles('petsitter')
  @ApiOperation({ summary: 'Petsitter aceita um agendamento' })
  accept(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.bookingsService.changeStatus(id, user.id, 'accepted');
  }

  @Patch(':id/decline')
  @Roles('petsitter')
  @ApiOperation({ summary: 'Petsitter recusa um agendamento' })
  decline(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.bookingsService.changeStatus(id, user.id, 'declined');
  }

  @Patch(':id/complete')
  @Roles('petsitter')
  @ApiOperation({ summary: 'Petsitter marca o agendamento como concluído' })
  complete(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.bookingsService.changeStatus(id, user.id, 'completed');
  }
}

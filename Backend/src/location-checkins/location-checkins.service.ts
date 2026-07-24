import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';

@Injectable()
export class LocationCheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(bookingId: string, petsitterId: string, dto: CreateCheckInDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');

    if (booking.petsitterId !== petsitterId) {
      throw new ForbiddenException('Apenas o petsitter deste agendamento pode enviar check-ins.');
    }

    if (booking.status !== 'accepted') {
      throw new BadRequestException('Só é possível enviar check-in enquanto o serviço está ativo.');
    }

    return this.prisma.locationCheckIn.create({
      data: {
        bookingId,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  // Regra de produto: só o tutor do booking consulta o trajeto (histórico permanente).
  async list(bookingId: string, tutorId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');

    if (booking.tutorId !== tutorId) {
      throw new ForbiddenException('Você não tem acesso ao trajeto deste agendamento.');
    }

    return this.prisma.locationCheckIn.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tutorId: string, createBookingDto: CreateBookingDto) {
    const { petsitterId, petIds, startDate, endDate, service, notes } =
      createBookingDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestException(
        'A data de término deve ser posterior à data de início.',
      );
    }

    const pets = await this.prisma.pet.findMany({
      where: { id: { in: petIds } }
    });
    
    if (pets.length !== petIds.length || pets.some(p => p.tutorId !== tutorId)) {
      throw new ForbiddenException(
        'Um ou mais pets são inválidos ou não pertencem ao tutor logado.',
      );
    }

    const petsitterProfile = await this.prisma.petsitterProfile.findUnique({
      where: { id: petsitterId },
    });

    if (!petsitterProfile) {
      throw new NotFoundException('Petsitter não encontrado.');
    }

    if (!petsitterProfile.services.includes(service)) {
      throw new BadRequestException('O petsitter não oferece este serviço.');
    }

    if (
      petsitterProfile.capacityPerDay &&
      petIds.length > petsitterProfile.capacityPerDay
    ) {
      throw new BadRequestException(
        `O número de pets (${petIds.length}) excede a capacidade diária do petsitter (${petsitterProfile.capacityPerDay}).`,
      );
    }

    const durationInHours =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Calcula preço com base no pricingConfig do serviço
    const pricingConfig = petsitterProfile.pricingConfig as Record<string, { type: string; price: number }> | null;
    const serviceConfig = pricingConfig?.[service];
    let totalPrice = 0;
    if (serviceConfig) {
      if (serviceConfig.type === 'fixed') {
        // Valor fixo × número de dias
        const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        totalPrice = serviceConfig.price * diffDays;
      } else {
        // Por hora
        totalPrice = Math.max(durationInHours * serviceConfig.price, 0);
      }
    } else {
      // Fallback para pricePerHour genérico
      totalPrice = Math.max(durationInHours * petsitterProfile.pricePerHour, 0);
    }

    // Multiplica o valor pelo número de pets
    totalPrice = totalPrice * petIds.length;

    return this.prisma.booking.create({
      data: {
        tutorId,
        petsitterId: petsitterProfile.userId,
        pets: { connect: petIds.map(id => ({ id })) },
        service,
        startDate: start,
        endDate: end,
        totalPrice,
        notes,
        status: 'pending',
      },
    });
  }

  async findAll(userId: string, role: string) {
    if (role === 'tutor') {
      return this.prisma.booking.findMany({
        where: { tutorId: userId },
        include: { petsitter: { select: { name: true } }, pets: true },
      });
    } else {
      return this.prisma.booking.findMany({
        where: { petsitterId: userId },
        include: { tutor: { select: { name: true } }, pets: true },
      });
    }
  }

  async getBusySlots(profileId: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });
    if (!profile) return [];

    return this.prisma.booking.findMany({
      where: {
        petsitterId: profile.userId,
        status: { in: ['pending', 'accepted'] },
        endDate: { gte: new Date() },
      },
      select: {
        startDate: true,
        endDate: true,
        _count: { select: { pets: true } }
      },
    });
  }

  async cancel(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { petsitter: { include: { petsitterProfile: { select: { pricingConfig: true } } } } }
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');

    const isTutor = booking.tutorId === userId;
    const isPetsitter = booking.petsitterId === userId;
    if (!isTutor && !isPetsitter) {
      throw new ForbiddenException('Você não tem permissão para cancelar este agendamento.');
    }

    if (booking.status !== 'pending' && booking.status !== 'accepted') {
      throw new BadRequestException('Não é possível cancelar um agendamento neste status.');
    }

    // Regra de 5 horas: só se aplica ao tutor e para serviços por hora
    if (isTutor) {
      // Usando uma asserção tipada de forma mais segura sem "as any"
      const profileInfo = booking.petsitter?.petsitterProfile as { pricingConfig?: any } | null;
      const pricingConfig = profileInfo?.pricingConfig as Record<string, { type: string }> | null;
      const serviceConfig = pricingConfig?.[booking.service];
      const isHourly = !serviceConfig || serviceConfig.type === 'per_hour';

      if (isHourly) {
        const hoursUntilStart = (booking.startDate.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilStart < 5) {
          throw new BadRequestException(
            'Agendamentos por hora só podem ser cancelados com 5 horas ou mais de antecedência. Entre em contato com o petsitter.'
          );
        }
      }
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });
  }

  async changeStatus(
    bookingId: string,
    petsitterId: string,
    status: 'accepted' | 'declined' | 'completed',
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');

    if (booking.petsitterId !== petsitterId) {
      throw new ForbiddenException(
        'Apenas o petsitter associado pode alterar para este status.',
      );
    }

    if (status === 'accepted' || status === 'declined') {
      if (booking.status !== 'pending')
        throw new BadRequestException('Agendamento não está pendente.');
    }

    if (status === 'completed') {
      if (booking.status !== 'accepted')
        throw new BadRequestException(
          'Agendamento precisa ser aceito antes de concluído.',
        );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}

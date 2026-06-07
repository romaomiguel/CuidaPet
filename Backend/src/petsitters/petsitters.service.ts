import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetsitterProfileDto } from './dto/create-petsitter-profile.dto';
import { UpdatePetsitterProfileDto } from './dto/update-petsitter-profile.dto';
import { MatchPetsittersDto } from './dto/match-petsitters.dto';

@Injectable()
export class PetsittersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createPetsitterProfileDto: CreatePetsitterProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.role !== 'petsitter') {
      throw new ConflictException('Usuário não tem o papel de petsitter.');
    }

    const existingProfile = await this.prisma.petsitterProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        'O usuário já possui um perfil de petsitter.',
      );
    }

    return this.prisma.petsitterProfile.create({
      data: { ...createPetsitterProfileDto, userId },
    });
  }

  async findAll(filters: { city?: string; service?: string; minRating?: number; maxPrice?: number; page?: number; limit?: number; status?: string } = {}) {
    const { city, service, minRating, maxPrice, page = 1, limit = 20, status } = filters;
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status) {
      where.status = 'approved';
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (service) {
      where.services = { has: service };
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (maxPrice) {
      where.pricePerHour = { lte: maxPrice };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.petsitterProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, avatar: true },
          },
        },
      }),
      this.prisma.petsitterProfile.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMatches(params: MatchPetsittersDto) {
    const { service, species, city, neighborhood, date, startTime, endTime, maxPrice } = params;

    // Serviços que cobram por diária (hospedagem e creche)
    const DAILY_SERVICES = ['hospedagem', 'creche'];
    const isDaily = DAILY_SERVICES.includes(service as string);

    const petsitters = await this.prisma.petsitterProfile.findMany({
      where: {
        status: 'approved',
        services: { has: service },
        acceptedSpecies: { has: species },
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });

    // Mapa do dia da semana em PT-BR para checar scheduleConfig
    const PT_DAYS: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda',
      2: 'Terça',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sábado',
    };

    const scoredMatches = petsitters.map((profile) => {
      let score = 0;
      const matchReasons: string[] = [];

      // ── Cidade (30pts) ──────────────────────────────────────────
      const cityMatch =
        profile.city && profile.city.toLowerCase() === city.toLowerCase();
      if (cityMatch) {
        score += 30;
        matchReasons.push(`🏙️ Atende em ${city}`);
      }

      // ── Bairro/Proximidade (15pts) ───────────────────────────────
      const neighborhoodMatch =
        neighborhood &&
        profile.location &&
        profile.location.toLowerCase().includes(neighborhood.toLowerCase());
      if (neighborhoodMatch) {
        score += 15;
        matchReasons.push(`📍 Atende no bairro ${neighborhood}`);
      }

      // ── Disponibilidade no horário (25pts) ───────────────────────
      let availabilityMatch = false;
      if (date && profile.scheduleConfig) {
        try {
          const dateObj = new Date(date + 'T12:00:00'); // noon to avoid timezone issues
          const dayName = PT_DAYS[dateObj.getDay()];
          const config = profile.scheduleConfig as Record<
            string,
            { enabled?: boolean; start?: string; end?: string }
          >;
          const dayConfig = config[dayName];

          if (dayConfig?.enabled) {
            if (!isDaily && startTime && dayConfig.start && dayConfig.end) {
              // Serviços por hora: verifica se o horário está dentro da janela
              const toMinutes = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
              };
              const reqStart = toMinutes(startTime);
              const configStart = toMinutes(dayConfig.start);
              const configEnd = toMinutes(dayConfig.end);
              if (reqStart >= configStart && reqStart < configEnd) {
                availabilityMatch = true;
              }
            } else if (isDaily) {
              // Serviços por diária: apenas verifica se o dia está habilitado
              availabilityMatch = true;
            }
          }
        } catch {
          // Se falhar ao parsear, ignora o critério
        }
      } else if (!date) {
        // Se não informou data, não penaliza
        availabilityMatch = true;
      }

      if (availabilityMatch) {
        score += 25;
        if (date) {
          const dateObj = new Date(date + 'T12:00:00');
          const dayName = PT_DAYS[dateObj.getDay()];
          if (!isDaily && startTime) {
            matchReasons.push(`✅ Disponível ${dayName.toLowerCase()} às ${startTime}`);
          } else {
            matchReasons.push(`✅ Disponível na data solicitada`);
          }
        }
      }

      // ── Avaliação (15–25pts) ─────────────────────────────────────
      // Petsitters novos (sem avaliações) recebem 15pts de bônus de confiança.
      // Petsitters avaliados recebem até 25pts proporcionalmente.
      if (profile.rating && profile.totalReviews > 0) {
        const ratingScore = 15 + (profile.rating / 5) * 10;
        score += ratingScore;
        matchReasons.push(
          `⭐ ${profile.rating.toFixed(1)} estrelas · ${profile.totalReviews} avaliações`,
        );
      } else {
        // Novo petsitter: bônus de confiança
        score += 15;
        matchReasons.push(`🆕 Novo na plataforma`);
      }

      // ── Orçamento (10–15pts) ──────────────────────────────────────
      if (maxPrice !== undefined) {
        const pConfig = profile.pricingConfig as Record<
          string,
          { price: number }
        > | null;
        const servicePrice = pConfig?.[service as string]?.price ?? profile.pricePerHour;

        if (servicePrice <= maxPrice) {
          score += 15;
          matchReasons.push(
            `💰 R$${servicePrice}/${isDaily ? 'dia' : 'h'} — dentro do orçamento`,
          );
        }
      } else {
        // Sem limite de orçamento: bônus neutro maior
        score += 10;
      }

      return {
        ...profile,
        matchScore: Math.round(score),
        matchReasons,
      };
    });

    return scoredMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15); // Máximo 15 resultados
  }

  async findOne(id: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, phone: true, avatar: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true, phone: true, avatar: true },
        },
      },
    });

    if (!profile) {
      // Create empty profile if it doesn't exist for a petsitter
      return this.prisma.petsitterProfile.create({
        data: {
          userId,
          bio: '',
          pricePerHour: 50,
          location: '',
          city: '',
          state: '',
          services: [],
          scheduleConfig: {} as Prisma.InputJsonObject,
          isAvailable: true,
          pricingConfig: {} as Prisma.InputJsonObject,
        },
        include: {
          user: {
            select: { name: true, email: true, phone: true, avatar: true },
          },
        },
      });
    }

    return profile;
  }

  async update(
    id: string,
    requestingUserId: string,
    updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    if (profile.userId !== requestingUserId) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar o perfil de outro petsitter.',
      );
    }

    return this.prisma.petsitterProfile.update({
      where: { id },
      data: {
        bio: updatePetsitterProfileDto.bio,
        pricePerHour: updatePetsitterProfileDto.pricePerHour,
        location: updatePetsitterProfileDto.location,
        city: updatePetsitterProfileDto.city,
        state: updatePetsitterProfileDto.state,
        services: updatePetsitterProfileDto.services,
        scheduleConfig: updatePetsitterProfileDto.scheduleConfig
          ? (updatePetsitterProfileDto.scheduleConfig as Prisma.InputJsonObject)
          : undefined,
        isAvailable: updatePetsitterProfileDto.isAvailable,
        pricingConfig: updatePetsitterProfileDto.pricingConfig
          ? (updatePetsitterProfileDto.pricingConfig as Prisma.InputJsonObject)
          : undefined,
        capacityPerDay: updatePetsitterProfileDto.capacityPerDay,
        identityProof: updatePetsitterProfileDto.identityProof,
        addressProof: updatePetsitterProfileDto.addressProof,
        acceptedSpecies: updatePetsitterProfileDto.acceptedSpecies,
      },
    });
  }

  async updateByUserId(
    userId: string,
    updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    return this.prisma.petsitterProfile.upsert({
      where: { userId },
      update: {
        bio: updatePetsitterProfileDto.bio ?? '',
        pricePerHour: updatePetsitterProfileDto.pricePerHour ?? 50,
        location: updatePetsitterProfileDto.location ?? '',
        city: updatePetsitterProfileDto.city ?? '',
        state: updatePetsitterProfileDto.state ?? '',
        services: updatePetsitterProfileDto.services ?? [],
        scheduleConfig: (updatePetsitterProfileDto.scheduleConfig ?? {}) as Prisma.InputJsonObject,
        isAvailable: updatePetsitterProfileDto.isAvailable ?? true,
        pricingConfig: (updatePetsitterProfileDto.pricingConfig ?? {}) as Prisma.InputJsonObject,
        capacityPerDay: updatePetsitterProfileDto.capacityPerDay ?? 1,
        identityProof: updatePetsitterProfileDto.identityProof,
        addressProof: updatePetsitterProfileDto.addressProof,
        acceptedSpecies: updatePetsitterProfileDto.acceptedSpecies ?? [],
      },
      create: {
        userId,
        bio: updatePetsitterProfileDto.bio ?? '',
        pricePerHour: updatePetsitterProfileDto.pricePerHour ?? 50,
        location: updatePetsitterProfileDto.location ?? '',
        city: updatePetsitterProfileDto.city ?? '',
        state: updatePetsitterProfileDto.state ?? '',
        services: updatePetsitterProfileDto.services ?? [],
        scheduleConfig: (updatePetsitterProfileDto.scheduleConfig ?? {}) as Prisma.InputJsonObject,
        isAvailable: updatePetsitterProfileDto.isAvailable ?? true,
        pricingConfig: (updatePetsitterProfileDto.pricingConfig ?? {}) as Prisma.InputJsonObject,
        capacityPerDay: updatePetsitterProfileDto.capacityPerDay ?? 1,
        identityProof: updatePetsitterProfileDto.identityProof,
        addressProof: updatePetsitterProfileDto.addressProof,
        acceptedSpecies: updatePetsitterProfileDto.acceptedSpecies ?? [],
      },
    });
  }

  async getCities() {
    const records = await this.prisma.petsitterProfile.findMany({
      where: { city: { not: '' } },
      select: { city: true },
      distinct: ['city'],
    });
    return records.map(r => r.city);
  }

  async changeStatus(id: string, status: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado');

    return this.prisma.petsitterProfile.update({
      where: { id },
      data: { status },
    });
  }
}

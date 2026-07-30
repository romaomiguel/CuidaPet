import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, AVATAR_SIGNED_URL_TTL_SECONDS } from '../storage/storage.service';
import { CreatePetsitterProfileDto } from './dto/create-petsitter-profile.dto';
import { UpdatePetsitterProfileDto } from './dto/update-petsitter-profile.dto';
import { PetsitterStatus } from './dto/update-petsitter-status.dto';
import { MatchPetsittersDto } from './dto/match-petsitters.dto';

@Injectable()
export class PetsittersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /** `user.avatar` guarda um path do Storage (não uma URL) — troca por signed URL só na saída. */
  private async withAvatarUrl<T extends { user: { avatar: string | null } }>(
    profile: T,
  ): Promise<T & { user: T['user'] & { avatarUrl: string | null } }> {
    const avatarUrl = await this.storageService.createAvatarUrl(
      profile.user.avatar,
      AVATAR_SIGNED_URL_TTL_SECONDS,
    );
    return { ...profile, user: { ...profile.user, avatarUrl } };
  }

  /** Versão em lote de `withAvatarUrl`, pra listagens — 1 chamada ao Storage em vez de N. */
  private async withAvatarUrls<T extends { user: { avatar: string | null } }>(
    profiles: T[],
  ): Promise<(T & { user: T['user'] & { avatarUrl: string | null } })[]> {
    const paths = profiles.map((p) => p.user.avatar).filter((p): p is string => Boolean(p));
    const urlMap = await this.storageService.createAvatarUrls(paths, AVATAR_SIGNED_URL_TTL_SECONDS);

    return profiles.map((profile) => ({
      ...profile,
      user: { ...profile.user, avatarUrl: profile.user.avatar ? urlMap.get(profile.user.avatar) ?? null : null },
    }));
  }

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
        select: this.publicProfileSelect(),
      }),
      this.prisma.petsitterProfile.count({ where }),
    ]);

    return {
      data: await this.withAvatarUrls(data),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMatches(params: MatchPetsittersDto) {
    const {
      service, species, city, neighborhood, date, startTime, endTime, maxPrice,
      petId, needsAirConditioning, needsBackyard, preferredWalkSchedule, preferredHomeType,
    } = params;

    let pet: { energyLevel: string | null; socialLevel: string | null } | null = null;
    if (petId) {
      pet = await this.prisma.pet.findUnique({
        where: { id: petId },
        select: { energyLevel: true, socialLevel: true },
      });
    }

    // Serviços que cobram por diária (hospedagem e creche)
    const DAILY_SERVICES = ['hospedagem', 'creche'];
    const isDaily = DAILY_SERVICES.includes(service as string);

    const petsitters = await this.prisma.petsitterProfile.findMany({
      where: {
        status: 'approved',
        services: { has: service },
        acceptedSpecies: { has: species },
      },
      select: this.publicProfileSelect(),
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

      // ── Clima e Infraestrutura (até 20pts) ────────────────────────
      if (needsAirConditioning && profile.hasAirConditioning) {
        score += 5;
        matchReasons.push('❄️ Ambiente com ar-condicionado');
      }
      if (needsBackyard && profile.hasBackyard) {
        score += 5;
        matchReasons.push('🌳 Ambiente com quintal');
      }
      if (preferredWalkSchedule && profile.walkSchedule === preferredWalkSchedule) {
        score += 5;
        matchReasons.push(
          `🕐 Passeios no horário ${preferredWalkSchedule === 'manha' ? 'da manhã' : 'da noite'}`,
        );
      }
      if (preferredHomeType && profile.homeType === preferredHomeType) {
        score += 5;
        matchReasons.push(`🏡 Atende em ${preferredHomeType}`);
      }

      // ── Compatibilidade do Pet (até 10pts) ─────────────────────────
      if (pet?.energyLevel === 'alto' && profile.hasBackyard) {
        score += 5;
        matchReasons.push('⚡ Espaço para gastar energia (pet de alta energia)');
      }
      if (pet?.socialLevel === 'exclusivo' && profile.capacityPerDay === 1) {
        score += 5;
        matchReasons.push('🐾 Cuidador atende um único pet por vez');
      }

      return {
        ...profile,
        matchScore: Math.round(score),
        matchReasons,
      };
    });

    const top15 = scoredMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15); // Máximo 15 resultados

    return this.withAvatarUrls(top15);
  }

  async findOne(id: string) {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id },
      select: this.publicProfileSelect(),
    });

    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    return this.withAvatarUrl(profile);
  }

  /**
   * Shape usado nas rotas PÚBLICAS (sem guard): findAll, findOne, findMatches.
   * Exclui identityProof/addressProof (documentos sensíveis) e email/phone do
   * usuário (não usados em nenhuma tela pública hoje) — essas rotas são
   * acessíveis por qualquer request anônimo, então nunca devem devolver dado
   * sensível. Rotas autenticadas (findByUserId/"me") continuam com seu próprio
   * include, sem essa restrição.
   */
  private publicProfileSelect() {
    return {
      id: true,
      userId: true,
      bio: true,
      services: true,
      pricePerHour: true,
      location: true,
      city: true,
      state: true,
      rating: true,
      totalReviews: true,
      scheduleConfig: true,
      isAvailable: true,
      photos: true,
      pricingConfig: true,
      capacityPerDay: true,
      status: true,
      acceptedSpecies: true,
      hasAirConditioning: true,
      homeType: true,
      hasBackyard: true,
      walkSchedule: true,
      user: { select: { name: true, avatar: true } },
    } as const;
  }

  /**
   * Shape usado SÓ pela listagem admin (`GET /petsitters/admin/list`, `@Roles('admin')`).
   * Precisa saber SE existe documento pra mostrar o botão de revisão — mas não expõe o
   * path em si na listagem (só quando o admin clica, via `getDocumentPath` + signed URL).
   * `identityProof`/`addressProof` brutos são lidos aqui só pra computar o booleano, e
   * removidos antes do retorno em `findAllForAdmin` (nunca saem deste service).
   */
  private adminProfileSelect() {
    return {
      id: true,
      userId: true,
      bio: true,
      services: true,
      pricePerHour: true,
      location: true,
      city: true,
      state: true,
      rating: true,
      totalReviews: true,
      isAvailable: true,
      capacityPerDay: true,
      status: true,
      acceptedSpecies: true,
      hasAirConditioning: true,
      homeType: true,
      hasBackyard: true,
      walkSchedule: true,
      identityProof: true,
      addressProof: true,
      user: { select: { name: true, email: true, phone: true, avatar: true } },
    } as const;
  }

  /** Listagem para o painel admin — com indicador de documento, sem reusar a rota pública. */
  async findAllForAdmin(
    filters: { city?: string; status?: string; page?: number; limit?: number } = {},
  ) {
    const { city, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.petsitterProfile.findMany({
        where,
        skip,
        take: limit,
        select: this.adminProfileSelect(),
      }),
      this.prisma.petsitterProfile.count({ where }),
    ]);

    const withAvatars = await this.withAvatarUrls(rows);
    const data = withAvatars.map(({ identityProof, addressProof, ...rest }) => ({
      ...rest,
      hasIdentityProof: Boolean(identityProof),
      hasAddressProof: Boolean(addressProof),
    }));

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
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
      const created = await this.prisma.petsitterProfile.create({
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
      return this.withAvatarUrl(created);
    }

    return this.withAvatarUrl(profile);
  }

  /**
   * Grava só o path do documento no Storage. Chamado exclusivamente pelos endpoints
   * de upload (`POST /petsitters/me/identity-proof|address-proof`) — nunca a partir
   * de um DTO de PATCH solto, já que esses campos não são mais aceitos via JSON.
   */
  async updateDocumentPath(
    userId: string,
    field: 'identityProof' | 'addressProof',
    path: string,
  ) {
    return this.prisma.petsitterProfile.update({
      where: { userId },
      data: field === 'identityProof' ? { identityProof: path } : { addressProof: path },
      select: { id: true, userId: true, identityProof: true, addressProof: true },
    });
  }

  /** Path armazenado de um documento, por id do perfil — usado pelos endpoints de leitura. */
  async getDocumentPath(
    profileId: string,
    field: 'identityProof' | 'addressProof',
  ): Promise<{ userId: string; path: string | null }> {
    const profile = await this.prisma.petsitterProfile.findUnique({
      where: { id: profileId },
      select: { userId: true, identityProof: true, addressProof: true },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de petsitter não encontrado.');
    }

    return {
      userId: profile.userId,
      path: field === 'identityProof' ? profile.identityProof : profile.addressProof,
    };
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
        offersLocationSharing: updatePetsitterProfileDto.offersLocationSharing,
        pricingConfig: updatePetsitterProfileDto.pricingConfig
          ? (updatePetsitterProfileDto.pricingConfig as Prisma.InputJsonObject)
          : undefined,
        capacityPerDay: updatePetsitterProfileDto.capacityPerDay,
        acceptedSpecies: updatePetsitterProfileDto.acceptedSpecies,
        hasAirConditioning: updatePetsitterProfileDto.hasAirConditioning,
        homeType: updatePetsitterProfileDto.homeType,
        hasBackyard: updatePetsitterProfileDto.hasBackyard,
        walkSchedule: updatePetsitterProfileDto.walkSchedule,
      },
    });
  }

  async updateByUserId(
    userId: string,
    updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    const data = {
      bio: updatePetsitterProfileDto.bio ?? '',
      pricePerHour: updatePetsitterProfileDto.pricePerHour ?? 50,
      location: updatePetsitterProfileDto.location ?? '',
      city: updatePetsitterProfileDto.city ?? '',
      state: updatePetsitterProfileDto.state ?? '',
      services: updatePetsitterProfileDto.services ?? [],
      scheduleConfig: (updatePetsitterProfileDto.scheduleConfig ?? {}) as Prisma.InputJsonObject,
      isAvailable: updatePetsitterProfileDto.isAvailable ?? true,
      offersLocationSharing: updatePetsitterProfileDto.offersLocationSharing ?? false,
      pricingConfig: (updatePetsitterProfileDto.pricingConfig ?? {}) as Prisma.InputJsonObject,
      capacityPerDay: updatePetsitterProfileDto.capacityPerDay ?? 1,
      acceptedSpecies: updatePetsitterProfileDto.acceptedSpecies ?? [],
      hasAirConditioning: updatePetsitterProfileDto.hasAirConditioning ?? false,
      homeType: updatePetsitterProfileDto.homeType,
      hasBackyard: updatePetsitterProfileDto.hasBackyard ?? false,
      walkSchedule: updatePetsitterProfileDto.walkSchedule,
    };

    return this.prisma.petsitterProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
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

  async changeStatus(id: string, status: PetsitterStatus) {
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

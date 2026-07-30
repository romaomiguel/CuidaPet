import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PartnerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartnerDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('E-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'partner',
        partnerProfile: {
          create: {
            type: dto.type,
            businessName: dto.businessName,
            cnpj: dto.cnpj,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            servicesOffered: dto.servicesOffered ?? [],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        partnerProfile: true,
      },
    });
  }

  async findAllForAdmin(
    filters: { type?: PartnerType; city?: string; page?: number; limit?: number } = {},
  ) {
    const { type, city, page = 1, limit = 20 } = filters;

    const where: { type?: PartnerType; city?: { contains: string; mode: 'insensitive' } } = {};
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.partnerProfile.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { name: true, email: true, isActive: true } } },
      }),
      this.prisma.partnerProfile.count({ where }),
    ]);

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, isActive: true } } },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de parceiro não encontrado.');
    }

    return profile;
  }

  async update(userId: string, dto: UpdatePartnerDto) {
    return this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        servicesOffered: dto.servicesOffered,
      },
    });
  }
}

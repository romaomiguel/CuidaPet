import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('PartnersService', () => {
  let service: PartnersService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    partnerProfile: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      partnerProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PartnersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PartnersService>(PartnersService);
  });

  describe('create', () => {
    const dto = {
      name: 'Ana Souza',
      email: 'clinica@example.com',
      password: 'Senha123',
      type: 'clinica' as const,
      businessName: 'Clínica Pet Bem',
      address: 'Rua A, 100',
      city: 'Cuiabá',
      state: 'MT',
    };

    it('creates a User(role=partner) + PartnerProfile and hashes the password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: dto.name,
        email: dto.email,
        role: 'partner',
        partnerProfile: { id: 'profile-1', type: dto.type, businessName: dto.businessName },
      });

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.email,
            password: 'hashed-password',
            role: 'partner',
            partnerProfile: {
              create: expect.objectContaining({
                type: dto.type,
                businessName: dto.businessName,
              }),
            },
          }),
        }),
      );
      expect(result.email).toBe(dto.email);
    });

    it('throws ConflictException when the email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllForAdmin', () => {
    it('paginates and filters by type', async () => {
      prisma.partnerProfile.findMany.mockResolvedValue([{ id: 'p1' }]);
      prisma.partnerProfile.count.mockResolvedValue(1);

      const result = await service.findAllForAdmin({ type: 'petshop' as any, page: 1, limit: 20 });

      expect(prisma.partnerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'petshop' }) }),
      );
      expect(result).toEqual({ data: [{ id: 'p1' }], total: 1, page: 1, pageSize: 20, totalPages: 1 });
    });
  });

  describe('findByUserId', () => {
    it('throws NotFoundException when no profile exists for the user', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue(null);

      await expect(service.findByUserId('user-x')).rejects.toThrow(NotFoundException);
    });

    it('returns the profile when found', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1' });

      const result = await service.findByUserId('user-1');

      expect(result).toEqual({ id: 'profile-1', userId: 'user-1' });
    });
  });

  describe('update', () => {
    it('updates only the fields present in the DTO, scoped to the owning user', async () => {
      prisma.partnerProfile.update.mockResolvedValue({ id: 'profile-1', businessName: 'Novo Nome' });

      const result = await service.update('user-1', { businessName: 'Novo Nome' });

      expect(prisma.partnerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { businessName: 'Novo Nome' },
      });
      expect(result.businessName).toBe('Novo Nome');
    });
  });
});

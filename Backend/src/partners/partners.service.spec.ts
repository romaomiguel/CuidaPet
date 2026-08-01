import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ServicesService } from '../services/services.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const storageServiceMock = {
  createAvatarUrl: jest.fn().mockResolvedValue(null),
  createAvatarUrls: jest.fn().mockResolvedValue(new Map()),
  deleteObject: jest.fn().mockResolvedValue(undefined),
};

const servicesServiceMock = {
  assertValidSlugs: jest.fn().mockResolvedValue(undefined),
};

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

    storageServiceMock.createAvatarUrl.mockReset().mockResolvedValue(null);
    storageServiceMock.createAvatarUrls.mockReset().mockResolvedValue(new Map());
    storageServiceMock.deleteObject.mockReset().mockResolvedValue(undefined);
    servicesServiceMock.assertValidSlugs.mockReset().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: ServicesService, useValue: servicesServiceMock },
      ],
    }).compile();

    service = module.get<PartnersService>(PartnersService);
  });

  describe('service catalog validation', () => {
    it('create() validates servicesOffered against dto.type as the audience', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1' });
      prisma.partnerProfile.findUnique.mockResolvedValue({
        id: 'p-1', type: 'clinica', servicesOffered: ['consulta_veterinaria'], photos: [],
        user: { name: 'x', email: 'x', isActive: true },
      });

      await service.create({
        name: 'x', email: 'x@x.com', password: 'Abcdefg1', type: 'clinica' as any,
        businessName: 'Clínica X', address: 'x', city: 'x', state: 'x',
        servicesOffered: ['consulta_veterinaria'],
      } as any);

      expect(servicesServiceMock.assertValidSlugs).toHaveBeenCalledWith(['consulta_veterinaria'], 'clinica');
    });

    it('update() looks up the existing type to use as the audience', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({ type: 'petshop' });
      prisma.partnerProfile.update.mockResolvedValue({
        id: 'p-1', type: 'petshop', servicesOffered: ['venda_produtos'], photos: [],
        user: { name: 'x', email: 'x', isActive: true },
      });

      await service.update('user-1', { servicesOffered: ['venda_produtos'] } as any);

      expect(servicesServiceMock.assertValidSlugs).toHaveBeenCalledWith(['venda_produtos'], 'petshop');
    });
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
      prisma.user.create.mockResolvedValue({ id: 'user-1' });
      prisma.partnerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        type: dto.type,
        businessName: dto.businessName,
        photos: [],
        user: { name: dto.name, email: dto.email, isActive: true },
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
      expect(result.type).toBe(dto.type);
      expect(result.businessName).toBe(dto.businessName);
      expect(result.user.email).toBe(dto.email);
    });

    it('throws ConflictException when the email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the CNPJ is already in use', async () => {
      const dtoWithCnpj = { ...dto, cnpj: '12.345.678/0001-99' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.partnerProfile.findUnique.mockResolvedValue({ id: 'existing-profile', cnpj: dtoWithCnpj.cnpj });

      await expect(service.create(dtoWithCnpj)).rejects.toThrow(ConflictException);
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

  describe('findAll', () => {
    it('only includes partners whose user is active', async () => {
      prisma.partnerProfile.findMany.mockResolvedValue([]);
      prisma.partnerProfile.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.partnerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user: { isActive: true } }),
        }),
      );
    });

    it('filters by type, service, and city, and paginates', async () => {
      prisma.partnerProfile.findMany.mockResolvedValue([
        {
          id: 'profile-1',
          type: 'clinica',
          businessName: 'Clínica Pet Bem',
          address: 'Rua A, 100',
          city: 'Cuiabá',
          state: 'MT',
          servicesOffered: ['consulta_veterinaria'],
          photos: [],
          user: { name: 'Clínica Pet Bem', avatar: null },
        },
      ]);
      prisma.partnerProfile.count.mockResolvedValue(1);

      const result = await service.findAll({
        type: 'clinica' as any,
        service: 'consulta_veterinaria' as any,
        city: 'Cuiabá',
        page: 1,
        limit: 20,
      });

      expect(prisma.partnerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'clinica',
            servicesOffered: { has: 'consulta_veterinaria' },
            city: { contains: 'Cuiabá', mode: 'insensitive' },
          }),
          skip: 0,
          take: 20,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('never selects email, cnpj, contactName, or isActive', async () => {
      prisma.partnerProfile.findMany.mockResolvedValue([]);
      prisma.partnerProfile.count.mockResolvedValue(0);

      await service.findAll({});

      const call = prisma.partnerProfile.findMany.mock.calls[0][0];
      expect(call.select).toBeDefined();
      expect(call.select).not.toHaveProperty('email');
      expect(call.select).not.toHaveProperty('cnpj');
      expect(call.select).not.toHaveProperty('contactName');
      expect(call.select.user.select).not.toHaveProperty('isActive');
      expect(call.select.user.select).not.toHaveProperty('email');
    });
  });

  describe('findByUserId', () => {
    it('throws NotFoundException when no profile exists for the user', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue(null);

      await expect(service.findByUserId('user-x')).rejects.toThrow(NotFoundException);
    });

    it('returns the profile when found', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1', photos: [] });

      const result = await service.findByUserId('user-1');

      expect(result).toEqual({ id: 'profile-1', userId: 'user-1', photos: [] });
    });
  });

  describe('update', () => {
    it('updates only the fields present in the DTO, scoped to the owning user', async () => {
      prisma.partnerProfile.update.mockResolvedValue({
        id: 'profile-1',
        businessName: 'Novo Nome',
        photos: [],
        user: { name: 'Ana Souza', email: 'ana@example.com', isActive: true },
      });

      const result = await service.update('user-1', { businessName: 'Novo Nome' });

      expect(prisma.partnerProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: { businessName: 'Novo Nome' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
        }),
      );
      expect(result.businessName).toBe('Novo Nome');
      expect(result.user.email).toBe('ana@example.com');
    });
  });

  describe('addPhoto', () => {
    it('throws BadRequestException when the profile already has 8 photos', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({
        photos: Array.from({ length: 8 }, (_, i) => `user-1/photos/${i}.jpg`),
      });

      await expect(service.addPhoto('user-1', 'user-1/photos/new.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('appends the new photo path and returns the updated array as signed URLs', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({ photos: ['user-1/photos/a.jpg'] });
      prisma.partnerProfile.update.mockResolvedValue({
        photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'],
      });
      storageServiceMock.createAvatarUrls.mockResolvedValue(
        new Map([
          ['user-1/photos/a.jpg', 'https://signed/a.jpg'],
          ['user-1/photos/b.jpg', 'https://signed/b.jpg'],
        ]),
      );

      const result = await service.addPhoto('user-1', 'user-1/photos/b.jpg');

      expect(prisma.partnerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'] },
        select: { photos: true },
      });
      expect(result.photos).toEqual(['https://signed/a.jpg', 'https://signed/b.jpg']);
    });
  });

  describe('removePhoto', () => {
    it('throws BadRequestException when the index is out of range', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({ photos: ['user-1/photos/a.jpg'] });

      await expect(service.removePhoto('user-1', 5)).rejects.toThrow(BadRequestException);
      expect(storageServiceMock.deleteObject).not.toHaveBeenCalled();
    });

    it('deletes the photo at the given index from Storage and the array', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({
        photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'],
      });
      prisma.partnerProfile.update.mockResolvedValue({ photos: ['user-1/photos/a.jpg'] });
      storageServiceMock.createAvatarUrls.mockResolvedValue(
        new Map([['user-1/photos/a.jpg', 'https://signed/a.jpg']]),
      );

      const result = await service.removePhoto('user-1', 1);

      expect(storageServiceMock.deleteObject).toHaveBeenCalledWith('user-1/photos/b.jpg');
      expect(result.photos).toEqual(['https://signed/a.jpg']);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when no partner exists with that id', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns only public-safe fields', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        businessName: 'Clínica Pet Bem',
        type: 'clinica',
        address: 'Rua A, 100',
        city: 'Cuiabá',
        state: 'MT',
        servicesOffered: ['consulta_veterinaria'],
        photos: [],
        user: { name: 'Clínica Pet Bem', avatar: null },
      });

      const result = await service.findOne('profile-1');

      expect(result.businessName).toBe('Clínica Pet Bem');
      expect(prisma.partnerProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'profile-1' },
          select: expect.objectContaining({
            businessName: true,
            type: true,
            address: true,
            city: true,
            state: true,
            servicesOffered: true,
            photos: true,
          }),
        }),
      );
    });

    it('excludes email/cnpj/contactName/isActive from the public response', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        businessName: 'Clínica Pet Bem',
        type: 'clinica',
        address: 'Rua A, 100',
        city: 'Cuiabá',
        state: 'MT',
        servicesOffered: ['consulta_veterinaria'],
        photos: [],
        user: { name: 'Clínica Pet Bem', avatar: null },
      });

      const result = await service.findOne('profile-1');

      expect(prisma.partnerProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({
            email: true,
            cnpj: true,
            contactName: true,
            isActive: true,
          }),
        }),
      );
      const selectArg = prisma.partnerProfile.findUnique.mock.calls[0][0].select;
      expect(selectArg).not.toHaveProperty('cnpj');
      expect(selectArg).not.toHaveProperty('contactName');
      expect(selectArg).not.toHaveProperty('isActive');
      expect(selectArg.user.select).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('cnpj');
      expect(result).not.toHaveProperty('contactName');
      expect(result).not.toHaveProperty('isActive');
      expect(result).not.toHaveProperty('email');
    });

    it('returns photos and avatar as signed URLs', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        businessName: 'Clínica Pet Bem',
        type: 'clinica',
        address: 'Rua A, 100',
        city: 'Cuiabá',
        state: 'MT',
        servicesOffered: ['consulta_veterinaria'],
        photos: ['user-1/photos/a.jpg'],
        user: { name: 'Clínica Pet Bem', avatar: 'user-1/avatar.jpg' },
      });
      storageServiceMock.createAvatarUrl.mockResolvedValue('https://signed/avatar.jpg');
      storageServiceMock.createAvatarUrls.mockResolvedValue(
        new Map([['user-1/photos/a.jpg', 'https://signed/a.jpg']]),
      );

      const result = await service.findOne('profile-1');

      expect(result.photos).toEqual(['https://signed/a.jpg']);
      expect(result.user.avatarUrl).toBe('https://signed/avatar.jpg');
    });
  });

  describe('findByUserId — signed URLs', () => {
    it('returns photos as signed URLs, not the raw stored paths', async () => {
      prisma.partnerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'],
        user: { name: 'Clínica Pet Bem', email: 'ana@example.com', isActive: true },
      });
      storageServiceMock.createAvatarUrls.mockResolvedValue(
        new Map([
          ['user-1/photos/a.jpg', 'https://signed/a.jpg'],
          ['user-1/photos/b.jpg', 'https://signed/b.jpg'],
        ]),
      );

      const result = await service.findByUserId('user-1');

      expect(result.photos).toEqual(['https://signed/a.jpg', 'https://signed/b.jpg']);
      expect(result.photos).not.toEqual(
        expect.arrayContaining(['user-1/photos/a.jpg', 'user-1/photos/b.jpg']),
      );
    });
  });

  describe('update — signed URLs', () => {
    it('returns photos as signed URLs, not the raw stored paths', async () => {
      prisma.partnerProfile.update.mockResolvedValue({
        id: 'profile-1',
        businessName: 'Novo Nome',
        photos: ['user-1/photos/a.jpg'],
        user: { name: 'Ana Souza', email: 'ana@example.com', isActive: true },
      });
      storageServiceMock.createAvatarUrls.mockResolvedValue(
        new Map([['user-1/photos/a.jpg', 'https://signed/a.jpg']]),
      );

      const result = await service.update('user-1', { businessName: 'Novo Nome' });

      expect(result.photos).toEqual(['https://signed/a.jpg']);
      expect(result.photos).not.toContain('user-1/photos/a.jpg');
    });
  });

  describe('create — contactName and display name', () => {
    it('sets User.name to businessName and stores dto.name as contactName', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1' });
      prisma.partnerProfile.findUnique.mockResolvedValueOnce({
        id: 'profile-1',
        businessName: 'Clínica Pet Bem',
        contactName: 'Ana Souza',
        photos: [],
        user: { name: 'Clínica Pet Bem', email: 'ana@example.com', isActive: true },
      });

      await service.create({
        name: 'Ana Souza',
        email: 'ana@example.com',
        password: 'Senha123',
        type: 'clinica' as any,
        businessName: 'Clínica Pet Bem',
        address: 'Rua A, 100',
        city: 'Cuiabá',
        state: 'MT',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Clínica Pet Bem',
            partnerProfile: expect.objectContaining({
              create: expect.objectContaining({
                contactName: 'Ana Souza',
                businessName: 'Clínica Pet Bem',
              }),
            }),
          }),
        }),
      );
    });
  });
});

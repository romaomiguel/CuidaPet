import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PetsittersService } from './petsitters.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function basePetsitter(overrides: Record<string, any> = {}) {
  return {
    id: 'ps-1',
    userId: 'user-1',
    bio: '',
    services: ['passeio'],
    pricePerHour: 50,
    location: '',
    city: 'Cuiabá',
    state: 'MT',
    rating: 0,
    totalReviews: 0,
    scheduleConfig: null,
    isAvailable: true,
    photos: [],
    pricingConfig: null,
    capacityPerDay: 1,
    status: 'approved',
    acceptedSpecies: ['cachorro'],
    hasAirConditioning: false,
    homeType: null,
    hasBackyard: false,
    walkSchedule: null,
    user: { name: 'Fulano', avatar: null },
    ...overrides,
  };
}

describe('PetsittersService.findMatches — clima/infraestrutura', () => {
  let service: PetsittersService;
  let prisma: {
    petsitterProfile: { findMany: jest.Mock };
    pet: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      petsitterProfile: { findMany: jest.fn() },
      pet: { findUnique: jest.fn() },
    };
    const storage = {
      createAvatarUrls: jest.fn().mockResolvedValue(new Map()),
      createAvatarUrl: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsittersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(PetsittersService);
  });

  it('awards points and a reason when the petsitter has AC and the tutor needs it', async () => {
    prisma.petsitterProfile.findMany.mockResolvedValue([basePetsitter({ hasAirConditioning: true })]);

    const [result] = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      needsAirConditioning: true,
    } as any);

    expect(result.matchScore).toBeGreaterThanOrEqual(5);
    expect(result.matchReasons.some((r: string) => r.includes('ar-condicionado'))).toBe(true);
  });

  it('does not award AC points when the petsitter lacks AC even if the tutor needs it', async () => {
    prisma.petsitterProfile.findMany.mockResolvedValue([basePetsitter({ hasAirConditioning: false })]);

    const [result] = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      needsAirConditioning: true,
    } as any);

    expect(result.matchReasons.some((r: string) => r.includes('ar-condicionado'))).toBe(false);
  });

  it('still returns the petsitter (never excludes) when no environment preference matches', async () => {
    prisma.petsitterProfile.findMany.mockResolvedValue([basePetsitter({ hasAirConditioning: false, hasBackyard: false })]);

    const result = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      needsAirConditioning: true,
      needsBackyard: true,
    } as any);

    expect(result).toHaveLength(1);
  });

  it('awards pet-compatibility points for a high-energy pet matched with a backyard petsitter', async () => {
    prisma.petsitterProfile.findMany.mockResolvedValue([basePetsitter({ hasBackyard: true })]);

    const [result] = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      petEnergyLevel: 'alto',
    } as any);

    expect(result.matchReasons.some((r: string) => r.includes('energia'))).toBe(true);
  });

  it('awards pet-compatibility points for an exclusive pet matched with a single-capacity petsitter', async () => {
    prisma.petsitterProfile.findMany.mockResolvedValue([basePetsitter({ capacityPerDay: 1 })]);

    const [result] = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      petSocialLevel: 'exclusivo',
    } as any);

    expect(result.matchReasons.some((r: string) => r.includes('único'))).toBe(true);
  });
});

describe('PetsittersService', () => {
  let service: PetsittersService;
  let prisma: {
    petsitterProfile: { findUnique: jest.Mock; update: jest.Mock };
  };
  let storageService: {
    createAvatarUrls: jest.Mock;
    createAvatarUrl: jest.Mock;
    deleteObject: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      petsitterProfile: { findUnique: jest.fn(), update: jest.fn() },
    };
    storageService = {
      createAvatarUrls: jest.fn().mockResolvedValue(new Map()),
      createAvatarUrl: jest.fn().mockResolvedValue(null),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsittersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get(PetsittersService);
  });

  describe('addPhoto', () => {
    it('throws BadRequestException when the profile already has 8 photos', async () => {
      (prisma.petsitterProfile.findUnique as jest.Mock).mockResolvedValue({
        photos: Array.from({ length: 8 }, (_, i) => `user-1/photos/${i}.jpg`),
      });

      await expect(service.addPhoto('user-1', 'user-1/photos/new.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('appends the new photo path and returns the updated array as signed URLs', async () => {
      (prisma.petsitterProfile.findUnique as jest.Mock).mockResolvedValue({
        photos: ['user-1/photos/a.jpg'],
      });
      (prisma.petsitterProfile.update as jest.Mock).mockResolvedValue({
        photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'],
      });
      (storageService.createAvatarUrls as jest.Mock).mockResolvedValue(
        new Map([
          ['user-1/photos/a.jpg', 'https://signed/a.jpg'],
          ['user-1/photos/b.jpg', 'https://signed/b.jpg'],
        ]),
      );

      const result = await service.addPhoto('user-1', 'user-1/photos/b.jpg');

      expect(prisma.petsitterProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'] },
        select: { photos: true },
      });
      expect(result.photos).toEqual(['https://signed/a.jpg', 'https://signed/b.jpg']);
    });
  });

  describe('removePhoto', () => {
    it('throws BadRequestException when the index is out of range', async () => {
      (prisma.petsitterProfile.findUnique as jest.Mock).mockResolvedValue({
        photos: ['user-1/photos/a.jpg'],
      });

      await expect(service.removePhoto('user-1', 5)).rejects.toThrow(BadRequestException);
      expect(storageService.deleteObject).not.toHaveBeenCalled();
    });

    it('deletes the photo at the given index from Storage and the array', async () => {
      (prisma.petsitterProfile.findUnique as jest.Mock).mockResolvedValue({
        photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'],
      });
      (prisma.petsitterProfile.update as jest.Mock).mockResolvedValue({
        photos: ['user-1/photos/a.jpg'],
      });
      (storageService.createAvatarUrls as jest.Mock).mockResolvedValue(
        new Map([['user-1/photos/a.jpg', 'https://signed/a.jpg']]),
      );

      const result = await service.removePhoto('user-1', 1);

      expect(storageService.deleteObject).toHaveBeenCalledWith('user-1/photos/b.jpg');
      expect(prisma.petsitterProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { photos: ['user-1/photos/a.jpg'] },
        select: { photos: true },
      });
      expect(result.photos).toEqual(['https://signed/a.jpg']);
    });
  });

  describe('findOne', () => {
    it('returns photos as signed URLs, not the raw stored paths', async () => {
      (prisma.petsitterProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'ps-1',
        userId: 'user-1',
        photos: ['user-1/photos/a.jpg', 'user-1/photos/b.jpg'],
        user: { name: 'Fulano', avatar: null },
      });
      (storageService.createAvatarUrls as jest.Mock).mockResolvedValue(
        new Map([
          ['user-1/photos/a.jpg', 'https://signed/a.jpg'],
          ['user-1/photos/b.jpg', 'https://signed/b.jpg'],
        ]),
      );

      const result = await service.findOne('ps-1');

      expect(result.photos).toEqual(['https://signed/a.jpg', 'https://signed/b.jpg']);
      expect(result.photos).not.toEqual(
        expect.arrayContaining(['user-1/photos/a.jpg', 'user-1/photos/b.jpg']),
      );
    });
  });

  describe('findByUserId', () => {
    it('returns photos as signed URLs, not the raw stored paths, for an existing profile', async () => {
      (prisma.petsitterProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'ps-1',
        userId: 'user-1',
        photos: ['user-1/photos/a.jpg'],
        user: { name: 'Fulano', email: 'a@a.com', phone: '', avatar: null },
      });
      (storageService.createAvatarUrls as jest.Mock).mockResolvedValue(
        new Map([['user-1/photos/a.jpg', 'https://signed/a.jpg']]),
      );

      const result = await service.findByUserId('user-1');

      expect(result.photos).toEqual(['https://signed/a.jpg']);
      expect(result.photos).not.toContain('user-1/photos/a.jpg');
    });
  });
});

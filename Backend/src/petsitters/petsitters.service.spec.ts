import { Test, TestingModule } from '@nestjs/testing';
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
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1', energyLevel: 'alto', socialLevel: null });

    const [result] = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      petId: 'pet-1',
    } as any);

    expect(result.matchReasons.some((r: string) => r.includes('energia'))).toBe(true);
  });

  it('awards pet-compatibility points for an exclusive pet matched with a single-capacity petsitter', async () => {
    prisma.petsitterProfile.findMany.mockResolvedValue([basePetsitter({ capacityPerDay: 1 })]);
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1', energyLevel: null, socialLevel: 'exclusivo' });

    const [result] = await service.findMatches({
      service: 'passeio' as any,
      species: 'cachorro' as any,
      city: 'Cuiabá',
      petId: 'pet-1',
    } as any);

    expect(result.matchReasons.some((r: string) => r.includes('único'))).toBe(true);
  });
});

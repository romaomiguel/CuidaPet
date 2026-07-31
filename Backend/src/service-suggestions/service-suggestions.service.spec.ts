import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServiceSuggestionsService } from './service-suggestions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ServiceSuggestionsService', () => {
  let service: ServiceSuggestionsService;
  let prisma: {
    serviceSuggestion: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      serviceSuggestion: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceSuggestionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ServiceSuggestionsService>(ServiceSuggestionsService);
  });

  describe('create', () => {
    it('creates a suggestion scoped to the requesting user', async () => {
      prisma.serviceSuggestion.create.mockResolvedValue({
        id: 'sugg-1',
        userId: 'user-1',
        description: 'Passeio noturno',
        status: 'pending',
      });

      const result = await service.create('user-1', { description: 'Passeio noturno' });

      expect(prisma.serviceSuggestion.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', description: 'Passeio noturno' },
      });
      expect(result.status).toBe('pending');
    });
  });

  describe('findAll', () => {
    it('filters by status and paginates', async () => {
      prisma.serviceSuggestion.findMany.mockResolvedValue([]);
      prisma.serviceSuggestion.count.mockResolvedValue(0);

      await service.findAll({ status: 'pending', page: 1, limit: 20 });

      expect(prisma.serviceSuggestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
          skip: 0,
          take: 20,
          include: { user: { select: { name: true, email: true, role: true } } },
        }),
      );
    });
  });

  describe('markReviewed', () => {
    it('throws NotFoundException when the suggestion does not exist', async () => {
      prisma.serviceSuggestion.findUnique.mockResolvedValue(null);

      await expect(service.markReviewed('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('updates status to reviewed', async () => {
      prisma.serviceSuggestion.findUnique.mockResolvedValue({ id: 'sugg-1' });
      prisma.serviceSuggestion.update.mockResolvedValue({ id: 'sugg-1', status: 'reviewed' });

      const result = await service.markReviewed('sugg-1');

      expect(prisma.serviceSuggestion.update).toHaveBeenCalledWith({
        where: { id: 'sugg-1' },
        data: { status: 'reviewed' },
      });
      expect(result.status).toBe('reviewed');
    });
  });
});

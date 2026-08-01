import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: {
    service: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      service: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  describe('create', () => {
    it('generates a slug from the name', async () => {
      prisma.service.findUnique.mockResolvedValue(null);
      prisma.service.create.mockResolvedValue({
        id: 's-1', slug: 'passeio_noturno', name: 'Passeio Noturno',
        emoji: '🌙', description: 'Passeio à noite', audience: 'petsitter', isActive: true,
      });

      const result = await service.create({
        name: 'Passeio Noturno', emoji: '🌙', description: 'Passeio à noite', audience: 'petsitter',
      });

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: { slug: 'passeio_noturno', name: 'Passeio Noturno', emoji: '🌙', description: 'Passeio à noite', audience: 'petsitter' },
      });
      expect(result.slug).toBe('passeio_noturno');
    });

    it('strips accents when generating the slug', async () => {
      prisma.service.findUnique.mockResolvedValue(null);
      prisma.service.create.mockResolvedValue({ id: 's-2', slug: 'consulta_veterinaria' });

      await service.create({
        name: 'Consulta Veterinária', emoji: '🩺', description: 'x', audience: 'clinica',
      });

      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'consulta_veterinaria' }) }),
      );
    });

    it('appends a numeric suffix when the generated slug already exists', async () => {
      prisma.service.findUnique
        .mockResolvedValueOnce({ id: 'existing', slug: 'passeio' })
        .mockResolvedValueOnce(null);
      prisma.service.create.mockResolvedValue({ id: 's-3', slug: 'passeio_2' });

      await service.create({ name: 'Passeio', emoji: '🦮', description: 'x', audience: 'petsitter' });

      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'passeio_2' }) }),
      );
    });

    // Finding 6 (revisão final): um nome só com emoji/pontuação/script não-latino gera slug
    // vazio depois de slugify — deve rejeitar em vez de criar uma linha com slug '' ou '_2'.
    it('throws BadRequestException when the name slugifies to an empty string', async () => {
      await expect(
        service.create({ name: '🐾🐾🐾', emoji: '🐾', description: 'x', audience: 'petsitter' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.service.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filters by audience and isActive when provided', async () => {
      prisma.service.findMany.mockResolvedValue([]);

      await service.findAll({ audience: 'clinica', isActive: true });

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { audience: 'clinica', isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('returns everything when no filters are given', async () => {
      prisma.service.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.service.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { name: 'asc' } });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.update('missing-id', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('updates name/emoji/description/audience/isActive, never the slug', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 's-1', slug: 'passeio' });
      prisma.service.update.mockResolvedValue({ id: 's-1', slug: 'passeio', name: 'Passeio Atualizado' });

      await service.update('s-1', { name: 'Passeio Atualizado', isActive: false });

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: { name: 'Passeio Atualizado', emoji: undefined, description: undefined, audience: undefined, isActive: false },
      });
    });
  });

  describe('assertValidSlugs', () => {
    it('does nothing for an empty array', async () => {
      await expect(service.assertValidSlugs([], 'petsitter')).resolves.toBeUndefined();
      expect(prisma.service.findMany).not.toHaveBeenCalled();
    });

    it('throws BadRequestException listing invalid or inactive slugs', async () => {
      prisma.service.findMany.mockResolvedValue([{ slug: 'passeio' }]);

      await expect(
        service.assertValidSlugs(['passeio', 'servico_inexistente'], 'petsitter'),
      ).rejects.toThrow(BadRequestException);
    });

    it('passes when every slug is active and matches the audience', async () => {
      prisma.service.findMany.mockResolvedValue([{ slug: 'passeio' }, { slug: 'hospedagem' }]);

      await expect(
        service.assertValidSlugs(['passeio', 'hospedagem'], 'petsitter'),
      ).resolves.toBeUndefined();
    });
  });
});

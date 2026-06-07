import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(tutorId: string, createPetDto: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ...createPetDto,
        tutorId,
      },
    });
  }

  findAll(tutorId: string) {
    return this.prisma.pet.findMany({
      where: { tutorId },
    });
  }

  async findOne(id: string, tutorId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id } });

    if (!pet) {
      throw new NotFoundException('Pet não encontrado.');
    }

    if (pet.tutorId !== tutorId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este pet.',
      );
    }

    return pet;
  }

  async update(id: string, tutorId: string, updatePetDto: UpdatePetDto) {
    await this.findOne(id, tutorId); // Valida existência e propriedade

    return this.prisma.pet.update({
      where: { id },
      data: updatePetDto,
    });
  }

  async remove(id: string, tutorId: string) {
    await this.findOne(id, tutorId); // Valida existência e propriedade

    await this.prisma.pet.delete({
      where: { id },
    });

    return { message: 'Pet removido com sucesso.' };
  }
}

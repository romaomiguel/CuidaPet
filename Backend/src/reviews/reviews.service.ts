import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tutorId: string, createReviewDto: CreateReviewDto) {
    const { petsitterId, bookingId, rating, comment } = createReviewDto;

    // Verificar se existe um agendamento concluído entre este tutor e este petsitter
    const completedBooking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        tutorId,
        petsitterId,
        status: 'completed',
      },
    });

    if (!completedBooking) {
      throw new ForbiddenException(
        'Agendamento inválido ou não concluído. Você só pode avaliar após a conclusão.',
      );
    }

    // Criar a review e atualizar a média do petsitter em uma transação
    return this.prisma.$transaction(async (prisma) => {
      const review = await prisma.review.create({
        data: {
          tutorId,
          petsitterId,
          bookingId,
          rating,
          comment,
        },
      });

      // Recalcular média
      const allReviews = await prisma.review.findMany({
        where: { petsitterId },
      });

      const totalReviews = allReviews.length;
      const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = sum / totalReviews;

      await prisma.petsitterProfile.update({
        where: { userId: petsitterId },
        data: {
          rating: averageRating,
          totalReviews,
        },
      });

      return review;
    });
  }

  async findByPetsitter(petsitterId: string) {
    return this.prisma.review.findMany({
      where: { petsitterId },
      include: {
        tutor: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

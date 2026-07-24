import { Injectable, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { REVIEW_TAGS_BY_RATING } from './review-tags.constants';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tutorId: string, createReviewDto: CreateReviewDto) {
    const { petsitterId, bookingId, rating, comment, tags = [] } = createReviewDto;

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

    // Nunca confiar só no frontend pra restringir as tags ao conjunto da nota —
    // valida de novo aqui contra a mesma fonte de verdade (review-tags.constants.ts).
    const allowedTags = REVIEW_TAGS_BY_RATING[rating] ?? [];
    const invalidTags = tags.filter((t) => !allowedTags.includes(t));
    if (invalidTags.length > 0) {
      throw new BadRequestException(
        `Tag(s) inválida(s) para a nota ${rating}: ${invalidTags.join(', ')}`,
      );
    }

    // Criar a review e atualizar a média do petsitter em uma transação
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const review = await prisma.review.create({
          data: {
            tutorId,
            petsitterId,
            bookingId,
            rating,
            comment,
            tags,
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
    } catch (error) {
      // @@unique([bookingId, tutorId]) no schema — reuso do mesmo booking vira P2002.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Você já avaliou este agendamento.');
      }
      throw error;
    }
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

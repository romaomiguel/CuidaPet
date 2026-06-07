import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tutor')
  @ApiOperation({ summary: 'Criar uma avaliação para um petsitter' })
  create(
    @CurrentUser() user: { id: string },
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  @Get('petsitter/:petsitterId')
  @ApiOperation({ summary: 'Listar todas as avaliações de um petsitter' })
  findByPetsitter(@Param('petsitterId') petsitterId: string) {
    return this.reviewsService.findByPetsitter(petsitterId);
  }
}

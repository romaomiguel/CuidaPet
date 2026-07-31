import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceSuggestionsService } from './service-suggestions.service';
import { CreateServiceSuggestionDto } from './dto/create-service-suggestion.dto';
import { UpdateServiceSuggestionStatusDto } from './dto/update-service-suggestion-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('service-suggestions')
@Controller('service-suggestions')
export class ServiceSuggestionsController {
  constructor(private readonly service: ServiceSuggestionsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter', 'partner')
  @ApiOperation({ summary: 'Sugerir um novo tipo de serviço (petsitter ou parceiro)' })
  @ApiResponse({ status: 201, description: 'Sugestão registrada.' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateServiceSuggestionDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Listar sugestões de serviço' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Atualizar o status de uma sugestão' })
  @ApiResponse({ status: 404, description: 'Sugestão não encontrada.' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceSuggestionStatusDto) {
    return this.service.setStatus(id, dto.status);
  }
}

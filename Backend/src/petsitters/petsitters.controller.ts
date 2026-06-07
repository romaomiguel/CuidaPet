import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PetsittersService } from './petsitters.service';
import { CreatePetsitterProfileDto } from './dto/create-petsitter-profile.dto';
import { UpdatePetsitterProfileDto } from './dto/update-petsitter-profile.dto';
import { MatchPetsittersDto } from './dto/match-petsitters.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('petsitters')
@Controller('petsitters')
export class PetsittersController {
  constructor(private readonly petsittersService: PetsittersService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Criar perfil de petsitter' })
  @ApiResponse({ status: 201, description: 'Perfil criado com sucesso.' })
  @ApiResponse({
    status: 409,
    description: 'Conflito (usuário já tem perfil).',
  })
  create(
    @CurrentUser() user: { id: string },
    @Body() createPetsitterProfileDto: CreatePetsitterProfileDto,
  ) {
    return this.petsittersService.create(user.id, createPetsitterProfileDto);
  }

  @Post('match')
  @ApiOperation({ summary: 'Encontrar petsitters ideais (Match)' })
  @ApiResponse({ status: 200, description: 'Matches encontrados com sucesso.' })
  findMatches(@Body() matchPetsittersDto: MatchPetsittersDto) {
    return this.petsittersService.findMatches(matchPetsittersDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar petsitters com paginação' })
  findAll(
    @Query('city')      city?: string,
    @Query('service')   service?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice')  maxPrice?: string,
    @Query('page')      page?: string,
    @Query('limit')     limit?: string,
    @Query('status')    status?: string,
  ) {
    return this.petsittersService.findAll({
      city,
      service,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice:  maxPrice  ? Number(maxPrice)  : undefined,
      page:      page      ? Number(page)      : 1,
      limit:     limit     ? Number(limit)     : 20,
      status,
    });
  }

  @Get('cities')
  @ApiOperation({ summary: 'Obter lista de cidades disponíveis' })
  getCities() {
    return this.petsittersService.getCities();
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Buscar perfil do petsitter logado' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findMe(@CurrentUser() user: { id: string }) {
    return this.petsittersService.findByUserId(user.id);
  }

  @ApiBearerAuth()
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petsitter')
  @ApiOperation({ summary: 'Atualizar perfil do petsitter logado' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  updateMe(
    @CurrentUser() user: { id: string },
    @Body() updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    return this.petsittersService.updateByUserId(
      user.id,
      updatePetsitterProfileDto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar perfil de petsitter por ID' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.petsittersService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar perfil de petsitter por ID (somente o dono)' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updatePetsitterProfileDto: UpdatePetsitterProfileDto,
  ) {
    return this.petsittersService.update(id, user.id, updatePetsitterProfileDto);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Atualizar status do petsitter por ID (apenas Admin)' })
  @ApiResponse({ status: 200, description: 'Status atualizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.petsittersService.changeStatus(id, status);
  }
}

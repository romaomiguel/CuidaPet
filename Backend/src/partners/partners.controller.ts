import { Controller, Get, Post, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerType } from '@prisma/client';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Cadastrar Clínica ou Petshop e gerar credenciais' })
  @ApiResponse({ status: 201, description: 'Parceiro criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail já está em uso.' })
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Get('admin/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[ADMIN] Listar parceiros (Clínicas e Petshops)' })
  findAllForAdmin(
    @Query('type') type?: PartnerType,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnersService.findAllForAdmin({
      type,
      city,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('partner')
  @ApiOperation({ summary: 'Buscar perfil do parceiro logado' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findMe(@CurrentUser() user: { id: string }) {
    return this.partnersService.findByUserId(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('partner')
  @ApiOperation({ summary: 'Atualizar perfil do parceiro logado' })
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(user.id, dto);
  }
}

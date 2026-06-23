import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  Patch,

  Post,

  Query,

} from '@nestjs/common';

import {

  ApiBearerAuth,

  ApiOperation,

  ApiTags,

} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { PaginationDto } from '../common/dto/pagination.dto';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { UsersService } from '../users/users.service';

import {

  CreateWarehouseDto,

  SetWarehouseStatusDto,

  UpdateWarehouseDto,

  WarehouseResponseDto,

} from './dto/warehouse.dto';

import { toWarehouseResponse } from './warehouses.mapper';

import { WarehousesService } from './warehouses.service';



@ApiTags('Warehouses')

@ApiBearerAuth()

@Controller('warehouses')

export class WarehousesController {

  constructor(

    private readonly warehousesService: WarehousesService,

    private readonly usersService: UsersService,

  ) {}



  @Get()

  @ApiOperation({ summary: 'Omborlar ro\'yxati' })

  async findAll(

    @Query() pagination: PaginationDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.warehousesService.findAll(pagination, scope);

  }



  @Get(':id')

  @ApiOperation({ summary: 'Ombor ma\'lumotlari' })

  async findOne(@Param('id') id: string): Promise<WarehouseResponseDto> {

    return this.warehousesService.findByIdResponse(id);

  }



  @Post()

  @ApiOperation({ summary: 'Yangi ombor yaratish' })

  async create(

    @Body() dto: CreateWarehouseDto,

  ): Promise<WarehouseResponseDto> {

    const warehouse = await this.warehousesService.create(dto);

    return toWarehouseResponse(warehouse);

  }



  @Patch(':id')

  @ApiOperation({ summary: 'Omborni yangilash' })

  async update(

    @Param('id') id: string,

    @Body() dto: UpdateWarehouseDto,

  ): Promise<WarehouseResponseDto> {

    const warehouse = await this.warehousesService.update(id, dto);

    return toWarehouseResponse(warehouse);

  }



  @Patch(':id/status')

  @ApiOperation({ summary: 'Omborni faol yoki nofaol qilish' })

  async setStatus(

    @Param('id') id: string,

    @Body() body: SetWarehouseStatusDto,

  ): Promise<WarehouseResponseDto> {

    const warehouse = await this.warehousesService.setActive(id, body.isActive);

    return toWarehouseResponse(warehouse);

  }



  @Delete(':id')

  @ApiOperation({ summary: 'Omborni o\'chirish' })

  async remove(@Param('id') id: string) {

    await this.warehousesService.remove(id);

    return { message: 'Ombor o\'chirildi' };

  }

}



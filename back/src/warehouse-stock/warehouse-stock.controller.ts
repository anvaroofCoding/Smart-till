import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { WarehouseStockQueryDto } from './dto/warehouse-stock-query.dto';
import {
  WarehouseStockDetailDto,
  WarehouseStockListItemDto,
} from './dto/warehouse-stock.dto';
import { WarehouseStockService } from './warehouse-stock.service';

@ApiTags('Warehouse Stock')
@ApiBearerAuth()
@Controller('warehouse-stock')
export class WarehouseStockController {
  constructor(
    private readonly warehouseStockService: WarehouseStockService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ombordagi maxsulotlar soni' })
  async findAll(
    @Query() query: WarehouseStockQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{
    data: WarehouseStockListItemDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
    };
  }> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseStockService.findAll(query, scope);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ombordagi maxsulot batafsil' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseStockDetailDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseStockService.findById(id, scope);
  }
}

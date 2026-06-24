import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CreateOrderDto, OrderResponseDto } from './dto/order.dto';
import { toOrderResponse } from './orders.mapper';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Buyurtma yaratish' })
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: Request & { user?: { sub?: string } },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto, req.user?.sub);
    return toOrderResponse(order);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buyurtma ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findByIdResponse(id);
  }
}

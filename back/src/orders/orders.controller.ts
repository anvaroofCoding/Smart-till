import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateDraftOrderDto,
  CreateOrderDto,
  OrderResponseDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Buyurtmalar ro\'yxati' })
  async findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Post('draft')
  @ApiOperation({ summary: 'Qoralama buyurtma yaratish' })
  async createDraft(
    @Body() dto: CreateDraftOrderDto,
    @Req() req: Request & { user?: { sub?: string } },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.createDraft(dto, req.user?.sub);
    return this.ordersService.findByIdResponse(order._id.toString());
  }

  @Post()
  @ApiOperation({ summary: 'Buyurtma yaratish' })
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: Request & { user?: { sub?: string } },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto, req.user?.sub);
    return this.ordersService.findByIdResponse(order._id.toString());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buyurtma ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findByIdResponse(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Qoralama buyurtmani yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.update(id, dto);
    return this.ordersService.findByIdResponse(order._id.toString());
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Buyurtmani tasdiqlash' })
  async confirm(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.confirm(id, dto);
    return this.ordersService.findByIdResponse(order._id.toString());
  }
}

import {

  Body,

  Controller,

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

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { UsersService } from '../users/users.service';

import {

  CreateDraftOrderDto,

  CreateOrderDto,

  FulfillOrderDto,

  OrderReceiptDto,

  OrderResponseDto,

  UpdateOrderDto,

} from './dto/order.dto';

import { OrderQueryDto } from './dto/order-query.dto';

import { OrdersService } from './orders.service';



@ApiTags('Orders')

@ApiBearerAuth()

@Controller('orders')

export class OrdersController {

  constructor(

    private readonly ordersService: OrdersService,

    private readonly usersService: UsersService,

  ) {}



  @Get()

  @ApiOperation({ summary: 'Buyurtmalar ro\'yxati' })

  async findAll(

    @Query() query: OrderQueryDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.ordersService.findAll(query, scope);

  }



  @Post('draft')

  @ApiOperation({ summary: 'Qoralama buyurtma yaratish' })

  async createDraft(

    @Body() dto: CreateDraftOrderDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.createDraft(dto, user.sub, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }



  @Post()

  @ApiOperation({ summary: 'Buyurtma yaratish' })

  async create(

    @Body() dto: CreateOrderDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.create(dto, user.sub, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }



  @Get(':id')

  @ApiOperation({ summary: 'Buyurtma ma\'lumotlari' })

  async findOne(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.ordersService.findByIdResponse(id, scope);

  }



  @Patch(':id')

  @ApiOperation({ summary: 'Qoralama buyurtmani yangilash' })

  async update(

    @Param('id') id: string,

    @Body() dto: UpdateOrderDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.update(id, dto, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }



  @Post(':id/confirm')

  @ApiOperation({ summary: 'Buyurtmani chiqimga yuborish' })

  async confirm(

    @Param('id') id: string,

    @Body() dto: UpdateOrderDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.confirm(id, dto, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }



  @Post(':id/receipt')

  @ApiOperation({ summary: 'Chek chop etish yoki atkaz qilish' })

  async recordReceipt(

    @Param('id') id: string,

    @Body() dto: OrderReceiptDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.recordReceipt(id, dto, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }



  @Post(':id/fulfill')

  @ApiOperation({ summary: 'Buyurtma chiqimini tasdiqlash' })

  async fulfill(

    @Param('id') id: string,

    @Body() dto: FulfillOrderDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.fulfill(id, dto, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }



  @Post(':id/cancel')

  @ApiOperation({ summary: 'Buyurtmani bekor qilish' })

  async cancel(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ): Promise<OrderResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const order = await this.ordersService.cancel(id, scope);

    return this.ordersService.findByIdResponse(order._id.toString(), scope);

  }

}



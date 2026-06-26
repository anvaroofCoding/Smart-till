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

import { StockReceiptsQueryDto } from './dto/stock-receipts-query.dto';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { UsersService } from '../users/users.service';

import {

  AddStockReceiptItemDto,

  AcceptStockReceiptDto,

  CreateStockReceiptDto,

  StockReceiptResponseDto,

  UpdateStockReceiptDto,

  UpdateStockReceiptItemDto,

} from './dto/stock-receipt.dto';

import { StockReceiptsService } from './stock-receipts.service';



@ApiTags('Stock Receipts')

@ApiBearerAuth()

@Controller('stock-receipts')

export class StockReceiptsController {

  constructor(

    private readonly stockReceiptsService: StockReceiptsService,

    private readonly usersService: UsersService,

  ) {}



  @Get()

  @ApiOperation({ summary: 'Maxsulot kirimlari ro\'yxati' })

  async findAll(

    @Query() pagination: StockReceiptsQueryDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.stockReceiptsService.findAll(pagination, scope);

  }



  @Get(':id')

  @ApiOperation({ summary: 'Kirim ma\'lumotlari' })

  async findOne(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Post()

  @ApiOperation({ summary: 'Yangi kirim yaratish' })

  async create(

    @Body() dto: CreateStockReceiptDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    const receipt = await this.stockReceiptsService.create(dto, scope);

    return this.stockReceiptsService.findByIdResponse(receipt._id.toString(), scope);

  }



  @Patch(':id')

  @ApiOperation({ summary: 'Kirimni tahrirlash' })

  async update(

    @Param('id') id: string,

    @Body() dto: UpdateStockReceiptDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.update(id, dto, scope);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Post(':id/items')

  @ApiOperation({ summary: 'Kirimga maxsulot qo\'shish' })

  async addItem(

    @Param('id') id: string,

    @Body() dto: AddStockReceiptItemDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.addItem(id, dto, scope);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Patch(':id/items/:itemId')

  @ApiOperation({ summary: 'Kirimdagi maxsulotni tahrirlash' })

  async updateItem(

    @Param('id') id: string,

    @Param('itemId') itemId: string,

    @Body() dto: UpdateStockReceiptItemDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.updateItem(id, itemId, dto, scope);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Delete(':id/items/:itemId')

  @ApiOperation({ summary: 'Kirimdagi maxsulotni o\'chirish' })

  async removeItem(

    @Param('id') id: string,

    @Param('itemId') itemId: string,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.removeItem(id, itemId, scope);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Post(':id/submit')

  @ApiOperation({ summary: 'Kirimni yuborish' })

  async submit(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.submit(id, scope);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Post(':id/accept')

  @ApiOperation({ summary: 'Kirimni qabul qilish' })

  async accept(

    @Param('id') id: string,

    @Body() dto: AcceptStockReceiptDto,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.accept(id, dto, scope, user.sub);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }



  @Post(':id/cancel')

  @ApiOperation({ summary: 'Kirimni bekor qilish' })

  async cancel(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ): Promise<StockReceiptResponseDto> {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    await this.stockReceiptsService.cancel(id, scope);

    return this.stockReceiptsService.findByIdResponse(id, scope);

  }

}



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
import { PaymentTypeQueryDto } from './dto/payment-type-query.dto';
import {
  CreatePaymentTypeDto,
  PaymentTypeResponseDto,
  SetPaymentTypeStatusDto,
  UpdatePaymentTypeDto,
} from './dto/payment-type.dto';
import { toPaymentTypeResponse } from './payment-types.mapper';
import { PaymentTypesService } from './payment-types.service';

@ApiTags('Payment Types')
@ApiBearerAuth()
@Controller('payment-types')
export class PaymentTypesController {
  constructor(private readonly paymentTypesService: PaymentTypesService) {}

  @Get()
  @ApiOperation({ summary: 'To\'lov turlari ro\'yxati' })
  findAll(@Query() query: PaymentTypeQueryDto) {
    return this.paymentTypesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'To\'lov turi ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<PaymentTypeResponseDto> {
    const paymentType = await this.paymentTypesService.findById(id);
    return toPaymentTypeResponse(paymentType);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi to\'lov turi yaratish' })
  async create(
    @Body() dto: CreatePaymentTypeDto,
  ): Promise<PaymentTypeResponseDto> {
    const paymentType = await this.paymentTypesService.create(dto);
    return toPaymentTypeResponse(paymentType);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'To\'lov turini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentTypeDto,
  ): Promise<PaymentTypeResponseDto> {
    const paymentType = await this.paymentTypesService.update(id, dto);
    return toPaymentTypeResponse(paymentType);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'To\'lov turini faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: SetPaymentTypeStatusDto,
  ): Promise<PaymentTypeResponseDto> {
    const paymentType = await this.paymentTypesService.setActive(
      id,
      body.isActive,
    );
    return toPaymentTypeResponse(paymentType);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'To\'lov turini o\'chirish' })
  async remove(@Param('id') id: string) {
    await this.paymentTypesService.remove(id);
    return { message: 'To\'lov turi o\'chirildi' };
  }
}

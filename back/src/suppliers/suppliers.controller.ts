import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateSupplierDto,
  SetSupplierStatusDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { toSupplierResponse } from './suppliers.mapper';
import { SuppliersService } from './suppliers.service';
import { SupplierLedgerService } from './supplier-ledger.service';
import {
  CreateSupplierLedgerEntryDto,
  SupplierLedgerEntryResponseDto,
} from './dto/supplier-ledger.dto';
import { toSupplierLedgerEntryResponse } from './supplier-ledger.mapper';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly supplierLedgerService: SupplierLedgerService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Yetkazib beruvchilar ro\'yxati' })
  findAll(@Query() pagination: PaginationDto) {
    return this.suppliersService.findAll(pagination);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Yetkazib beruvchi hisoboti' })
  findLedger(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.supplierLedgerService.findAll(id, pagination);
  }

  @Post(':id/ledger/debt')
  @ApiOperation({ summary: 'Qarzdorlik qo\'shish' })
  async addDebt(
    @Param('id') id: string,
    @Body() dto: CreateSupplierLedgerEntryDto,
  ): Promise<SupplierLedgerEntryResponseDto> {
    const entry = await this.supplierLedgerService.createEntry(id, 'debt', dto);
    return toSupplierLedgerEntryResponse(entry);
  }

  @Post(':id/ledger/payment')
  @ApiOperation({ summary: 'To\'lov qo\'shish' })
  async addPayment(
    @Param('id') id: string,
    @Body() dto: CreateSupplierLedgerEntryDto,
  ): Promise<SupplierLedgerEntryResponseDto> {
    const entry = await this.supplierLedgerService.createEntry(
      id,
      'payment',
      dto,
    );
    return toSupplierLedgerEntryResponse(entry);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Yetkazib beruvchi ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.findById(id);
    return toSupplierResponse(supplier);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi yetkazib beruvchi yaratish' })
  async create(@Body() dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.create(dto);
    return toSupplierResponse(supplier);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Yetkazib beruvchini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.update(id, dto);
    return toSupplierResponse(supplier);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Yetkazib beruvchini faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: SetSupplierStatusDto,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.setActive(id, body.isActive);
    return toSupplierResponse(supplier);
  }
}

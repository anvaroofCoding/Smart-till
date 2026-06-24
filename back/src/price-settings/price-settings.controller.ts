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
import {
  CreatePriceSettingDto,
  PriceSettingResponseDto,
  SetPriceSettingStatusDto,
  UpdatePriceSettingDto,
} from './dto/price-setting.dto';
import { PriceSettingQueryDto } from './dto/price-setting-query.dto';
import { toPriceSettingResponse } from './price-settings.mapper';
import { PriceSettingsService } from './price-settings.service';

@ApiTags('Price Settings')
@ApiBearerAuth()
@Controller('price-settings')
export class PriceSettingsController {
  constructor(private readonly priceSettingsService: PriceSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Narx sozlamalari ro\'yxati' })
  findAll(@Query() query: PriceSettingQueryDto) {
    return this.priceSettingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Narx sozlamasi ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<PriceSettingResponseDto> {
    const setting = await this.priceSettingsService.findById(id);
    return toPriceSettingResponse(setting);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi narx sozlamasi yaratish' })
  async create(
    @Body() dto: CreatePriceSettingDto,
  ): Promise<PriceSettingResponseDto> {
    const setting = await this.priceSettingsService.create(dto);
    return toPriceSettingResponse(setting);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Narx sozlamasini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePriceSettingDto,
  ): Promise<PriceSettingResponseDto> {
    const setting = await this.priceSettingsService.update(id, dto);
    return toPriceSettingResponse(setting);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Narx sozlamasini faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: SetPriceSettingStatusDto,
  ): Promise<PriceSettingResponseDto> {
    const setting = await this.priceSettingsService.setActive(id, body.isActive);
    return toPriceSettingResponse(setting);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Narx sozlamasini o\'chirish' })
  async remove(@Param('id') id: string) {
    await this.priceSettingsService.remove(id);
    return { message: 'Narx sozlamasi o\'chirildi' };
  }
}

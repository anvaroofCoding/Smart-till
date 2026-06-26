import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import {
  AcceptWarehouseTransferDto,
  CreateWarehouseTransferDraftDto,
  CreateWarehouseTransferDto,
  SendWarehouseTransferDraftDto,
  UpdateAcceptanceProgressDto,
  UpdateWarehouseTransferDraftDto,
  WarehouseTransferResponseDto,
  WarehouseTransfersQueryDto,
} from './dto/warehouse-transfer.dto';
import { WarehouseTransfersService } from './warehouse-transfers.service';

@ApiTags('Warehouse Transfers')
@ApiBearerAuth()
@Controller('warehouse-transfers')
export class WarehouseTransfersController {
  constructor(
    private readonly warehouseTransfersService: WarehouseTransfersService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Transferlar ro\'yxati' })
  async findAll(
    @Query() query: WarehouseTransfersQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.findAll(query, scope);
  }

  @Get('drafts/current')
  @ApiOperation({ summary: 'Joriy jarayondagi transfer' })
  async findCurrentDraft(
    @Query('fromWarehouseId') fromWarehouseId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto | null> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.findCurrentDraft(
      fromWarehouseId,
      user.sub,
      scope,
    );
  }

  @Get('destinations')
  @ApiOperation({ summary: 'Transfer uchun qabul qiluvchi omborlar' })
  async listDestinations(
    @Query('fromWarehouseId') fromWarehouseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.listDestinationWarehouses(
      fromWarehouseId,
      scope,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Transfer ma\'lumotlari' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.findById(id, scope);
  }

  @Post('drafts')
  @ApiOperation({ summary: 'Jarayondagi transfer yaratish' })
  async createDraft(
    @Body() dto: CreateWarehouseTransferDraftDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    const draft = await this.warehouseTransfersService.createDraft(
      dto,
      user.sub,
      scope,
    );
    if (!draft) {
      throw new NotFoundException('Transfer topilmadi');
    }
    return draft;
  }

  @Post()
  @ApiOperation({ summary: 'Transfer yaratish va yuborish' })
  async createAndSend(
    @Body() dto: CreateWarehouseTransferDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.createAndSend(dto, user.sub, scope);
  }

  @Patch(':id/draft')
  @ApiOperation({ summary: 'Jarayondagi transferni yangilash' })
  async updateDraft(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseTransferDraftDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto | null> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.updateDraft(id, dto, user.sub, scope);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Jarayondagi transferni yuborish' })
  async sendDraft(
    @Param('id') id: string,
    @Body() dto: SendWarehouseTransferDraftDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.sendDraft(id, dto, user.sub, scope);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Transferni qabul qilish' })
  async accept(
    @Param('id') id: string,
    @Body() dto: AcceptWarehouseTransferDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.accept(id, dto, user.sub, scope);
  }

  @Patch(':id/acceptance-progress')
  @ApiOperation({ summary: 'Qabul qilish jarayonini saqlash' })
  async updateAcceptanceProgress(
    @Param('id') id: string,
    @Body() dto: UpdateAcceptanceProgressDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WarehouseTransferResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.warehouseTransfersService.updateAcceptanceProgress(
      id,
      dto,
      scope,
    );
  }
}

import {

  Body,

  Controller,

  Get,

  Param,

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

import { PaginationDto } from '../common/dto/pagination.dto';

import { UsersService } from '../users/users.service';

import {

  AddCashToMainDto,

  AddExpenseDto,

  AddManualIncomeDto,

  DailyBalanceQueryDto,

  DailyBalanceEntryQueryDto,

} from './dto/daily-balance.dto';

import { DailyBalancesService } from './daily-balances.service';



@ApiTags('Daily Balances')

@ApiBearerAuth()

@Controller('daily-balances')

export class DailyBalancesController {

  constructor(

    private readonly dailyBalancesService: DailyBalancesService,

    private readonly usersService: UsersService,

  ) {}



  @Get()

  @ApiOperation({ summary: 'Kunlik balanslar ro\'yxati' })

  async findAll(

    @Query() query: DailyBalanceQueryDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.findAll(query, scope);

  }



  @Get('entries')

  @ApiOperation({ summary: 'Kunlik balans harakatlari' })

  async findEntries(

    @Query() query: DailyBalanceEntryQueryDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.findEntries(query, scope);

  }



  @Get('main-balance')

  @ApiOperation({ summary: 'Asosiy balans' })

  async getMainBalance(@CurrentUser() user: JwtPayload) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.getMainBalance(scope);

  }



  @Get('transfers')

  @ApiOperation({ summary: 'Asosiy balansga o\'tkazmalar tarixi' })

  async getTransfers(

    @Query() pagination: PaginationDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.getTransferHistory(

      pagination.page,

      pagination.perPage,

      scope,

    );

  }



  @Get(':id')

  @ApiOperation({ summary: 'Kunlik balans tafsilotlari' })

  async findById(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.findById(id, scope);

  }



  @Post(':id/income')

  @ApiOperation({ summary: 'Kirim qo\'shish' })

  async addIncome(

    @Param('id') id: string,

    @Body() dto: AddManualIncomeDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.addManualIncome(id, dto, user.sub, scope);

  }



  @Post(':id/expense')

  @ApiOperation({ summary: 'Xarajat qo\'shish' })

  async addExpense(

    @Param('id') id: string,

    @Body() dto: AddExpenseDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.addExpense(id, dto, user.sub, scope);

  }



  @Post(':id/deposit-main')

  @ApiOperation({ summary: 'Asosiy balansga naqd pul qo\'shish' })

  async depositCashToMain(

    @Param('id') id: string,

    @Body() dto: AddCashToMainDto,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.depositCashToMain(id, dto, user.sub, scope);

  }



  @Post(':id/close')

  @ApiOperation({ summary: 'Kunni yopish' })

  async closeDay(

    @Param('id') id: string,

    @CurrentUser() user: JwtPayload,

  ) {

    const scope = await this.usersService.getWarehouseScope(user.sub);

    return this.dailyBalancesService.closeDay(id, scope);

  }

}



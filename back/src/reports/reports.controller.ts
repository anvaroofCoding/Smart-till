import { Controller, Get } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SalesReportDto } from './dto/sales-report.dto';

import { ReportsService } from './reports.service';



@ApiTags('Reports')

@ApiBearerAuth()

@Controller('reports')

export class ReportsController {

  constructor(private readonly reportsService: ReportsService) {}



  @Get('sales')

  @ApiOperation({

    summary: 'Omborlar bo\'yicha savdo hisoboti',

    description:

      'Barcha filiallar bo\'yicha umumiy hisobot. Barcha autentifikatsiyadan o\'tgan foydalanuvchilar uchun.',

  })

  async getSalesReport(): Promise<SalesReportDto> {

    return this.reportsService.getSalesReport();

  }

}



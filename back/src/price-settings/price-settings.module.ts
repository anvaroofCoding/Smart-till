import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PriceSetting,
  PriceSettingSchema,
} from './schemas/price-setting.schema';
import { PriceSettingsController } from './price-settings.controller';
import { PriceSettingsService } from './price-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceSetting.name, schema: PriceSettingSchema },
    ]),
  ],
  controllers: [PriceSettingsController],
  providers: [PriceSettingsService],
  exports: [PriceSettingsService],
})
export class PriceSettingsModule {}

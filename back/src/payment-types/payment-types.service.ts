import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import {
  buildIdFilter,
  escapeRegex,
  parseCreatedAtFilter,
} from '../common/utils/list-filter.utils';
import {
  inferPaymentChannel,
} from '../daily-balances/constants/payment-channel';
import {
  CreatePaymentTypeDto,
  InstallmentPlanDto,
  UpdatePaymentTypeDto,
} from './dto/payment-type.dto';
import { PaymentTypeQueryDto } from './dto/payment-type-query.dto';
import { toPaymentTypeResponse } from './payment-types.mapper';
import {
  PaymentType,
  PaymentTypeDocument,
} from './schemas/payment-type.schema';
import {
  SYSTEM_PAYMENT_TYPES,
} from './constants/system-payment-types';

@Injectable()
export class PaymentTypesService implements OnModuleInit {
  constructor(
    @InjectModel(PaymentType.name)
    private readonly paymentTypeModel: Model<PaymentTypeDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSystemPaymentTypes();
  }

  async create(dto: CreatePaymentTypeDto): Promise<PaymentTypeDocument> {
    const name = dto.name.trim();
    await this.ensureUniqueName(name);
    this.validateLogo(dto.logo);
    const installmentPlans = this.normalizeInstallmentPlans(
      dto.installmentPlans,
    );

    const paymentType = await this.paymentTypeModel.create({
      name,
      logo: dto.logo?.trim() ?? '',
      installmentPlans,
      channel: dto.channel ?? inferPaymentChannel(name),
      isActive: dto.isActive ?? true,
    });

    return this.findById(paymentType._id.toString());
  }

  async findAll(query: PaymentTypeQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const filter = this.buildListFilter(query);

    const [items, total] = await Promise.all([
      this.paymentTypeModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.paymentTypeModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toPaymentTypeResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<PaymentTypeDocument> {
    const paymentType = await this.paymentTypeModel.findById(id).exec();
    if (!paymentType) {
      throw new NotFoundException('To\'lov turi topilmadi');
    }
    return paymentType;
  }

  async update(
    id: string,
    dto: UpdatePaymentTypeDto,
  ): Promise<PaymentTypeDocument> {
    const paymentType = await this.findById(id);
    const isSystem = this.isSystemPaymentType(paymentType);

    if (isSystem) {
      if (dto.name !== undefined && dto.name.trim() !== paymentType.name) {
        throw new BadRequestException(
          'Tizim to\'lov turi nomini o\'zgartirib bo\'lmaydi',
        );
      }
      if (
        dto.channel !== undefined &&
        dto.channel !== paymentType.channel
      ) {
        throw new BadRequestException(
          'Tizim to\'lov turi kanalini o\'zgartirib bo\'lmaydi',
        );
      }
      if (dto.isActive === false) {
        throw new BadRequestException(
          'Tizim to\'lov turini nofaol qilib bo\'lmaydi',
        );
      }
    }

    if (dto.name !== undefined && !isSystem) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException(
          'To\'lov turi nomi bo\'sh bo\'lmasligi kerak',
        );
      }
      await this.ensureUniqueName(name, id);
      paymentType.name = name;
    }

    if (dto.logo !== undefined) {
      this.validateLogo(dto.logo);
      paymentType.logo = dto.logo.trim();
    }

    if (dto.installmentPlans !== undefined) {
      paymentType.installmentPlans = this.normalizeInstallmentPlans(
        dto.installmentPlans,
      );
    }

    if (dto.isActive !== undefined && !isSystem) {
      paymentType.isActive = dto.isActive;
    }

    if (!isSystem) {
      if (dto.channel !== undefined) {
        paymentType.channel = dto.channel;
      } else if (dto.name !== undefined) {
        paymentType.channel = inferPaymentChannel(paymentType.name);
      }
    }

    await paymentType.save();
    return this.findById(id);
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<PaymentTypeDocument> {
    const paymentType = await this.findById(id);
    if (this.isSystemPaymentType(paymentType) && !isActive) {
      throw new BadRequestException(
        'Tizim to\'lov turini nofaol qilib bo\'lmaydi',
      );
    }
    paymentType.isActive = isActive;
    await paymentType.save();
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const paymentType = await this.findById(id);
    if (this.isSystemPaymentType(paymentType)) {
      throw new BadRequestException(
        'Tizim to\'lov turini o\'chirib bo\'lmaydi',
      );
    }
    await this.paymentTypeModel.findByIdAndDelete(id).exec();
  }

  private isSystemPaymentType(paymentType: PaymentTypeDocument): boolean {
    return !!paymentType.systemKey;
  }

  private async seedSystemPaymentTypes() {
    for (const definition of SYSTEM_PAYMENT_TYPES) {
      let paymentType = await this.paymentTypeModel
        .findOne({ systemKey: definition.systemKey })
        .exec();

      if (!paymentType) {
        paymentType = await this.paymentTypeModel
          .findOne({
            channel: definition.channel,
            $or: [
              { systemKey: { $exists: false } },
              { systemKey: null },
            ],
          })
          .sort({ createdAt: 1 })
          .exec();
      }

      if (!paymentType) {
        paymentType = await this.paymentTypeModel
          .findOne({
            name: new RegExp(`^${escapeRegex(definition.name)}$`, 'i'),
          })
          .exec();
      }

      if (paymentType) {
        paymentType.systemKey = definition.systemKey;
        paymentType.name = definition.name;
        paymentType.channel = definition.channel;
        paymentType.isActive = true;
        await paymentType.save();
        continue;
      }

      try {
        await this.paymentTypeModel.create({
          name: definition.name,
          channel: definition.channel,
          systemKey: definition.systemKey,
          isActive: true,
          logo: '',
          installmentPlans: [],
        });
      } catch (error) {
        const code = (error as { code?: number }).code;
        if (code !== 11_000) {
          throw error;
        }

        const existing = await this.paymentTypeModel
          .findOne({
            name: new RegExp(`^${escapeRegex(definition.name)}$`, 'i'),
          })
          .exec();
        if (!existing) {
          throw error;
        }

        existing.systemKey = definition.systemKey;
        existing.name = definition.name;
        existing.channel = definition.channel;
        existing.isActive = true;
        await existing.save();
      }
    }
  }

  private normalizeInstallmentPlans(
    plans?: InstallmentPlanDto[],
  ): InstallmentPlanDto[] {
    if (!plans?.length) {
      return [];
    }

    const normalized = plans.map((plan) => ({
      months: Math.trunc(plan.months),
      interestPercent: Number(plan.interestPercent),
    }));

    const monthsSet = new Set<number>();
    for (const plan of normalized) {
      if (plan.months < 1 || plan.months > 120) {
        throw new BadRequestException(
          'Bo\'lib to\'lash oylari 1 dan 120 gacha bo\'lishi kerak',
        );
      }
      if (plan.interestPercent < 0 || plan.interestPercent > 100) {
        throw new BadRequestException(
          'Foiz stavkasi 0 dan 100 gacha bo\'lishi kerak',
        );
      }
      if (monthsSet.has(plan.months)) {
        throw new BadRequestException(
          `Bir xil muddat (${plan.months} oy) ikki marta kiritilgan`,
        );
      }
      monthsSet.add(plan.months);
    }

    return normalized.sort((a, b) => a.months - b.months);
  }

  private validateLogo(logo?: string) {
    if (!logo?.trim()) return;
    if (!logo.trim().startsWith('data:image/')) {
      throw new BadRequestException(
        'Logo faqat rasm (base64 data URL) ko\'rinishida bo\'lishi kerak',
      );
    }
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    const existing = await this.paymentTypeModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        'Bu nomdagi to\'lov turi allaqachon mavjud',
      );
    }
  }

  private buildListFilter(
    query: PaymentTypeQueryDto,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [];

    const idFilter = buildIdFilter(query.id);
    if (idFilter) and.push(idFilter);

    if (query.name?.trim()) {
      and.push({ name: new RegExp(escapeRegex(query.name.trim()), 'i') });
    }

    if (query.isActive !== undefined) {
      and.push({ isActive: query.isActive });
    }

    const createdAtRange = parseCreatedAtFilter(query.createdAt);
    if (createdAtRange) {
      and.push({ createdAt: createdAtRange });
    }

    if (query.search?.trim()) {
      const search = escapeRegex(query.search.trim());
      const regex = new RegExp(search, 'i');
      and.push({ $or: [{ name: regex }] });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }
}

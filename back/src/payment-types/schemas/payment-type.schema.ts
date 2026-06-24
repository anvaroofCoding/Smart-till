import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentTypeDocument = HydratedDocument<PaymentType>;

@Schema({ _id: false })
export class InstallmentPlan {
  @Prop({ required: true, min: 1 })
  months: number;

  @Prop({ required: true, min: 0 })
  interestPercent: number;
}

export const InstallmentPlanSchema =
  SchemaFactory.createForClass(InstallmentPlan);

@Schema({ timestamps: true, collection: 'payment_types' })
export class PaymentType {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ default: '' })
  logo: string;

  @Prop({ type: [InstallmentPlanSchema], default: [] })
  installmentPlans: InstallmentPlan[];

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentTypeSchema = SchemaFactory.createForClass(PaymentType);

PaymentTypeSchema.index({ name: 'text' });
PaymentTypeSchema.index({ isActive: 1 });

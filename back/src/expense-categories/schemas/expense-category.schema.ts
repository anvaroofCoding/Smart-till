import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExpenseCategoryDocument = HydratedDocument<ExpenseCategory>;

@Schema({ timestamps: true, collection: 'expense_categories' })
export class ExpenseCategory {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: ExpenseCategory.name, default: null })
  parentId?: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExpenseCategorySchema =
  SchemaFactory.createForClass(ExpenseCategory);

ExpenseCategorySchema.index({ isActive: 1 });
ExpenseCategorySchema.index({ parentId: 1, name: 1 }, { unique: true });

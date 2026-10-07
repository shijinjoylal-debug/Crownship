import mongoose, { Document, Schema } from 'mongoose';

export interface ITelegramActivation extends Document {
    id: string;
    token: string;
    orderId: string;
    productId: string;
    productName: string;
    licenseIndex: number;
    totalQuantity: number;
    telegramId: number | null;
    status: 'unused' | 'used' | 'revoked';
    usedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const TelegramActivationSchema = new Schema<ITelegramActivation>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    orderId: {
        type: String,
        required: true,
        index: true,
    },
    productId: {
        type: String,
        default: '',
    },
    productName: {
        type: String,
        required: true,
    },
    licenseIndex: {
        type: Number,
        default: 1,
    },
    totalQuantity: {
        type: Number,
        default: 1,
    },
    telegramId: {
        type: Number,
        default: null,
    },
    status: {
        type: String,
        enum: ['unused', 'used', 'revoked'],
        default: 'unused',
        index: true,
    },
    usedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Prevent duplicate compile during hot reload
export default (mongoose.models.TelegramActivation as mongoose.Model<ITelegramActivation>) ||
    mongoose.model<ITelegramActivation>('TelegramActivation', TelegramActivationSchema);

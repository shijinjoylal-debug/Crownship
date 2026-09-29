import mongoose from 'mongoose';

const PurchasedUserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    items: [{
        id: { type: String },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        telegramTokens: [{
            token: { type: String, required: true },
            telegramId: { type: Number, default: null },
            telegramUsername: { type: String, default: null },
            telegramConnected: { type: Boolean, default: false },
            connectedAt: { type: Date, default: null },
        }]
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
    telegramToken: {
        type: String,
        default: null,
    },
    telegramId: {
        type: Number,
        default: null,
    },
    telegramConnected: {
        type: Boolean,
        default: false,
    },
    telegramTokens: [{
        token: { type: String, required: true },
        itemId: { type: String, default: '' },
        itemName: { type: String, required: true },
        licenseIndex: { type: Number, required: true },
        totalQuantity: { type: Number, default: 1 },
        telegramId: { type: Number, default: null },
        telegramUsername: { type: String, default: null },
        telegramConnected: { type: Boolean, default: false },
        connectedAt: { type: Date, default: null },
    }]
}, { timestamps: true });

export default mongoose.models.PurchasedUser || mongoose.model('PurchasedUser', PurchasedUserSchema);


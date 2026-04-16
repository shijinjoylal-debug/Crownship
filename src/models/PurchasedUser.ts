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
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
}, { timestamps: true });


export default mongoose.models.PurchasedUser || mongoose.model('PurchasedUser', PurchasedUserSchema);

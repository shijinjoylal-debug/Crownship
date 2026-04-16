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
    status: {
        type: String,
        default: 'pending',
    },
}, { timestamps: true });


export default mongoose.models.PurchasedUser || mongoose.model('PurchasedUser', PurchasedUserSchema);

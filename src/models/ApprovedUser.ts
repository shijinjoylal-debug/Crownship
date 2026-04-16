import mongoose from 'mongoose';

const ApprovedUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
}, { 
    timestamps: true,
    collection: 'approved_users' // Explicitly set the collection name
});

export default mongoose.models.ApprovedUser || mongoose.model('ApprovedUser', ApprovedUserSchema);

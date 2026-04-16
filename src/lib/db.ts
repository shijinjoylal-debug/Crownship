import dbConnect from './mongoose';
import ProductModel from '@/models/Product';
import UserModel from '@/models/User';
import PurchasedUserModel from '@/models/PurchasedUser';
import ApprovedUserModel from '@/models/ApprovedUser';
import { Product, User, PurchasedUser, ApprovedUser } from './types';

// Ensure connection is established
dbConnect();

export const db = {
    products: {
        getAll: async () => {
            await dbConnect();
            const products = await ProductModel.find({}).lean();
            return products.map((p: any) => ({
                ...p,
                id: p.id, // Ensure id is string if needed, or map _id to something else if using Mongoose IDs. 
                // But we used 'id' field in schema, so it should be fine.
            })) as Product[];
        },
        getById: async (id: string) => {
            await dbConnect();
            const product = await ProductModel.findOne({ id }).lean();
            return product as Product | undefined;
        },
    },
    users: {
        findByEmail: async (email: string) => {
            await dbConnect();
            const user = await UserModel.findOne({ email }).lean();
            if (!user) return undefined;
            return {
                ...user,
                id: user._id.toString(), // Map _id to id for User type
            } as User;
        },
        create: async (user: User) => {
            await dbConnect();
            const newUser = await UserModel.create({
                ...user,
                // Mongoose handles _id, so we can ignore id if 'User' type has optional id or handle it.
                // If User type expects 'id', we might need to handle it. 
                // Let's assume User type has 'id' as string.
            });
            return {
                ...newUser.toObject(),
                id: newUser._id.toString()
            } as User;
        }
    },
    purchasedUsers: {
        create: async (data: PurchasedUser) => {
            await dbConnect();
            const newPurchasedUser = await PurchasedUserModel.create(data);
            return newPurchasedUser.toObject() as PurchasedUser;
        },
        getAll: async () => {
            await dbConnect();
            const users = await PurchasedUserModel.find({}).lean();
            return users as PurchasedUser[];
        },
        getByEmail: async (email: string) => {
            await dbConnect();
            const user = await PurchasedUserModel.findOne({ email }).lean();
            return user as PurchasedUser | undefined;
        },
        getById: async (id: string) => {
            await dbConnect();
            const user = await PurchasedUserModel.findOne({ id }).lean();
            return user as PurchasedUser | undefined;
        },
        updateStatus: async (id: string, status: 'confirmed' | 'failed') => {
            await dbConnect();
            const user = await PurchasedUserModel.findOneAndUpdate(
                { id },
                { status },
                { new: true }
            ).lean();
            return user as PurchasedUser | undefined;
        }
    },
    approvedUsers: {
        getAllEmails: async () => {
            await dbConnect();
            const users = await ApprovedUserModel.find({}).lean();
            return users.map((u: any) => u.email) as string[];
        }
    }
};



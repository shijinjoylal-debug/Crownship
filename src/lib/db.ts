import dbConnect from './mongoose';
import ProductModel from '@/models/Product';
import UserModel from '@/models/User';
import PurchasedUserModel from '@/models/PurchasedUser';
import ApprovedUserModel from '@/models/ApprovedUser';
import TelegramActivationModel from '@/models/TelegramActivation';
import { Product, User, PurchasedUser, ApprovedUser, TelegramActivationRecord } from './types';

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
        updateStatus: async (id: string, status: 'confirmed' | 'failed', razorpayPaymentId?: string) => {
            await dbConnect();
            const updateFields: any = { status };
            if (razorpayPaymentId) {
                updateFields.razorpayPaymentId = razorpayPaymentId;
            }
            const user = await PurchasedUserModel.findOneAndUpdate(
                { id },
                { $set: updateFields },
                { new: true }
            ).lean();
            return user as PurchasedUser | undefined;
        },
        getByTelegramToken: async (telegramToken: string) => {
            await dbConnect();

            const user = await PurchasedUserModel
                .findOne({
                    $or: [
                        { telegramToken },
                        { 'telegramTokens.token': telegramToken },
                        { 'items.telegramTokens.token': telegramToken }
                    ]
                })
                .lean();

            return user as PurchasedUser | undefined;
        },

        connectTelegramByToken: async (
            telegramToken: string,
            telegramId: number,
            telegramUsername?: string
        ) => {
            await dbConnect();

            // First find the user record containing this token
            const existing = await PurchasedUserModel.findOne({
                $or: [
                    { telegramToken },
                    { 'telegramTokens.token': telegramToken },
                    { 'items.telegramTokens.token': telegramToken }
                ]
            });

            if (!existing) {
                return null;
            }

            // Check if token in telegramTokens array
            let matchedTokenObj = existing.telegramTokens?.find((t: any) => t.token === telegramToken);
            if (!matchedTokenObj && existing.telegramToken === telegramToken) {
                matchedTokenObj = {
                    token: existing.telegramToken,
                    telegramConnected: existing.telegramConnected,
                    telegramId: existing.telegramId,
                    itemName: existing.items?.[0]?.name || 'Trading Tool',
                    licenseIndex: 1
                };
            }

            // If already connected to another telegramId
            if (matchedTokenObj?.telegramConnected && matchedTokenObj.telegramId && matchedTokenObj.telegramId !== telegramId) {
                throw new Error('This license token has already been claimed by another Telegram account.');
            }

            const now = new Date();

            // Update matching element in telegramTokens array
            await PurchasedUserModel.updateOne(
                {
                    _id: existing._id,
                    'telegramTokens.token': telegramToken
                },
                {
                    $set: {
                        'telegramTokens.$.telegramConnected': true,
                        'telegramTokens.$.telegramId': telegramId,
                        'telegramTokens.$.telegramUsername': telegramUsername || null,
                        'telegramTokens.$.connectedAt': now
                    }
                }
            );

            // Also update in items.telegramTokens if present
            await PurchasedUserModel.updateOne(
                {
                    _id: existing._id,
                    'items.telegramTokens.token': telegramToken
                },
                {
                    $set: {
                        'items.$[].telegramTokens.$[tok].telegramConnected': true,
                        'items.$[].telegramTokens.$[tok].telegramId': telegramId,
                        'items.$[].telegramTokens.$[tok].telegramUsername': telegramUsername || null,
                        'items.$[].telegramTokens.$[tok].connectedAt': now
                    }
                },
                {
                    arrayFilters: [{ 'tok.token': telegramToken }]
                }
            );

            // If it's the root token, also update root fields
            const updateRoot: any = {};
            if (existing.telegramToken === telegramToken) {
                updateRoot.telegramConnected = true;
                updateRoot.telegramId = telegramId;
            }

            const updatedUser = await PurchasedUserModel.findByIdAndUpdate(
                existing._id,
                { $set: updateRoot },
                { new: true }
            ).lean();

            return {
                user: updatedUser as PurchasedUser,
                activation: matchedTokenObj
            };
        },

        connectTelegram: async (
            id: string,
            telegramId: number
        ) => {
            await dbConnect();

            const user = await PurchasedUserModel.findOneAndUpdate(
                {
                    id,
                    status: 'confirmed',
                    telegramConnected: false
                },
                {
                    telegramId,
                    telegramConnected: true
                },
                {
                    new: true
                }
            ).lean();

            return user as PurchasedUser | undefined;
        },

        updateConfirmed: async (
            id: string,
            updateData?: {
                razorpayPaymentId?: string;
                razorpayOrderId?: string;
                razorpayAmount?: number;
            }
        ) => {
            await dbConnect();
            const setFields: any = { status: 'confirmed' };
            if (updateData?.razorpayPaymentId) setFields.razorpayPaymentId = updateData.razorpayPaymentId;
            if (updateData?.razorpayOrderId) setFields.razorpayOrderId = updateData.razorpayOrderId;
            if (updateData?.razorpayAmount !== undefined) setFields.razorpayAmount = updateData.razorpayAmount;

            const user = await PurchasedUserModel.findOneAndUpdate(
                { id },
                { $set: setFields },
                { new: true }
            ).lean();

            return user as PurchasedUser | undefined;
        },
    },
    activations: {
        findByToken: async (token: string) => {
            await dbConnect();
            const act = await TelegramActivationModel.findOne({ token }).lean();
            return act as TelegramActivationRecord | null;
        },
        createBatch: async (records: Array<{
            id: string;
            token: string;
            orderId: string;
            productId?: string;
            productName: string;
            licenseIndex: number;
            totalQuantity: number;
            telegramId?: number | null;
            status: 'unused' | 'used' | 'revoked';
            usedAt?: Date | null;
        }>) => {
            await dbConnect();
            const created = await TelegramActivationModel.insertMany(records);
            return created;
        },
        getByOrderId: async (orderId: string) => {
            await dbConnect();
            const acts = await TelegramActivationModel.find({ orderId }).sort({ licenseIndex: 1 }).lean();
            return acts as TelegramActivationRecord[];
        },
        getUnusedByOrderId: async (orderId: string) => {
            await dbConnect();
            const acts = await TelegramActivationModel.find({ orderId, status: 'unused' }).sort({ licenseIndex: 1 }).lean();
            return acts as TelegramActivationRecord[];
        },
        redeemAtomically: async (token: string, telegramId: number) => {
            await dbConnect();
            const updated = await TelegramActivationModel.findOneAndUpdate(
                { token, status: 'unused' },
                {
                    $set: {
                        status: 'used',
                        telegramId,
                        usedAt: new Date(),
                    }
                },
                { new: true }
            ).lean();
            return updated as TelegramActivationRecord | null;
        }
    },
    approvedUsers: {
        getAllEmails: async () => {
            await dbConnect();
            const users = await ApprovedUserModel.find({}).lean();
            return users.map((u: any) => u.email).filter(Boolean) as string[];
        }
    }
};




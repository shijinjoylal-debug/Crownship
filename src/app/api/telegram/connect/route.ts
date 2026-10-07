import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import TelegramActivationModel from '@/models/TelegramActivation';
import PurchasedUserModel from '@/models/PurchasedUser';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        const cleanToken = token.trim();
        const activation = await TelegramActivationModel.findOne({ token: cleanToken });

        if (activation) {
            const order = await PurchasedUserModel.findOne({ id: activation.orderId });
            const isConfirmed = order && order.status === 'confirmed';

            return NextResponse.json({
                valid: isConfirmed && activation.status === 'unused',
                status: activation.status,
                orderConfirmed: isConfirmed,
                productName: activation.productName,
                licenseIndex: activation.licenseIndex,
                totalQuantity: activation.totalQuantity,
            });
        }

        // Check legacy records
        const legacyUser = await db.purchasedUsers.getByTelegramToken(cleanToken);
        if (!legacyUser || legacyUser.status !== 'confirmed') {
            return NextResponse.json(
                { valid: false, error: 'Invalid or unconfirmed license token' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            valid: true,
            status: legacyUser.status,
            customerName: legacyUser.name,
            legacy: true,
        });

    } catch (error: any) {
        console.error('Telegram verify token error:', error);
        return NextResponse.json(
            { valid: false, error: 'Internal server error verifying token' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        // 1. Authenticate the Python bot using Authorization: Bearer <CROWNSHIP_BOT_SECRET>
        const authHeader = req.headers.get('authorization') || '';
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        const providedSecret = match ? match[1].trim() : '';

        const expectedSecret = process.env.CROWNSHIP_BOT_SECRET;
        if (!expectedSecret) {
            console.error('CROWNSHIP_BOT_SECRET is not configured on the server');
            return NextResponse.json(
                { success: false, error: 'Server misconfiguration: bot secret not configured' },
                { status: 500 }
            );
        }

        const providedBuf = Buffer.from(providedSecret, 'utf-8');
        const expectedBuf = Buffer.from(expectedSecret, 'utf-8');

        if (
            providedBuf.length === 0 ||
            providedBuf.length !== expectedBuf.length ||
            !crypto.timingSafeEqual(providedBuf, expectedBuf)
        ) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid bot secret' },
                { status: 401 }
            );
        }

        // 2 & 3. Validate token and telegramId
        const body = await req.json().catch(() => ({}));
        const { token, telegramId } = body;

        if (!token || typeof token !== 'string' || !token.trim()) {
            return NextResponse.json(
                { success: false, error: 'Invalid or missing token' },
                { status: 400 }
            );
        }

        const parsedTelegramId = Number(telegramId);
        if (!telegramId || isNaN(parsedTelegramId) || !Number.isSafeInteger(parsedTelegramId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid or missing telegramId' },
                { status: 400 }
            );
        }

        const cleanToken = token.trim();

        // 4. Find TelegramActivation by token
        const activation = await TelegramActivationModel.findOne({ token: cleanToken });

        if (activation) {
            // 5. Verify activation belongs to a confirmed purchase
            const order = await PurchasedUserModel.findOne({ id: activation.orderId });
            if (!order || order.status !== 'confirmed') {
                return NextResponse.json(
                    { success: false, error: 'Activation does not belong to a confirmed purchase' },
                    { status: 400 }
                );
            }

            // 6. Verify activation status is unused
            if (activation.status !== 'unused') {
                return NextResponse.json(
                    { success: false, error: 'This activation link is invalid or has already been used.' },
                    { status: 400 }
                );
            }

            // 7. Atomically mark it used and store telegramId
            const now = new Date();
            const updated = await TelegramActivationModel.findOneAndUpdate(
                {
                    token: cleanToken,
                    status: 'unused',
                },
                {
                    $set: {
                        status: 'used',
                        telegramId: parsedTelegramId,
                        usedAt: now,
                    },
                },
                {
                    new: true,
                }
            );

            // 8. Return success only if the atomic update actually matched
            if (!updated) {
                return NextResponse.json(
                    { success: false, error: 'This activation link is invalid or has already been used.' },
                    { status: 409 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Purchase activated successfully',
                activation: {
                    productName: updated.productName,
                    productId: updated.productId,
                    licenseIndex: updated.licenseIndex,
                    totalQuantity: updated.totalQuantity,
                    telegramId: updated.telegramId,
                    usedAt: updated.usedAt,
                },
            });
        }

        // Backward compatibility fallback for legacy orders
        const legacyUser = await db.purchasedUsers.getByTelegramToken(cleanToken);
        if (!legacyUser || legacyUser.status !== 'confirmed') {
            return NextResponse.json(
                { success: false, error: 'Invalid activation token or purchase not confirmed' },
                { status: 404 }
            );
        }

        const legacyResult = await db.purchasedUsers.connectTelegramByToken(
            cleanToken,
            parsedTelegramId
        );

        if (!legacyResult) {
            return NextResponse.json(
                { success: false, error: 'Unable to connect Telegram account' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Purchase activated successfully',
            activation: {
                productName: legacyResult.activation?.itemName || 'Trading Tool',
                telegramId: parsedTelegramId,
            },
        });

    } catch (error: any) {
        console.error('Telegram connect error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

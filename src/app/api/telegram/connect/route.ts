import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        const user = await db.purchasedUsers.getByTelegramToken(token);

        if (!user || user.status !== 'confirmed') {
            return NextResponse.json(
                { valid: false, error: 'Invalid or unconfirmed license token' },
                { status: 404 }
            );
        }

        // Find activation token details
        const activation = user.telegramTokens?.find((t: any) => t.token === token) || {
            token: user.telegramToken,
            itemName: user.items?.[0]?.name || 'Trading Tool',
            licenseIndex: 1,
            totalQuantity: 1,
            telegramConnected: !!user.telegramConnected,
            telegramId: user.telegramId || null,
        };

        return NextResponse.json({
            valid: true,
            status: user.status,
            customerName: user.name,
            activation: {
                itemName: activation.itemName,
                licenseIndex: activation.licenseIndex,
                totalQuantity: activation.totalQuantity || 1,
                connected: !!activation.telegramConnected,
                connectedTelegramId: activation.telegramId || null,
            }
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
        const body = await req.json();
        const { token, telegramId, telegramUsername } = body;

        if (!token || !telegramId) {
            return NextResponse.json(
                { success: false, error: 'Token and telegramId are required' },
                { status: 400 }
            );
        }

        const parsedTelegramId = Number(telegramId);
        if (isNaN(parsedTelegramId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid telegramId format' },
                { status: 400 }
            );
        }

        // Check if token exists and order is confirmed
        const existingOrder = await db.purchasedUsers.getByTelegramToken(token);
        if (!existingOrder) {
            return NextResponse.json(
                { success: false, error: 'Invalid activation token' },
                { status: 404 }
            );
        }

        if (existingOrder.status !== 'confirmed') {
            return NextResponse.json(
                { success: false, error: 'Order payment has not been confirmed yet' },
                { status: 400 }
            );
        }

        const result = await db.purchasedUsers.connectTelegramByToken(
            token,
            parsedTelegramId,
            telegramUsername
        );

        if (!result) {
            return NextResponse.json(
                { success: false, error: 'Unable to connect Telegram account' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Telegram account connected successfully!',
            customerName: result.user.name,
            activation: {
                itemName: result.activation?.itemName || 'Trading Tool',
                licenseIndex: result.activation?.licenseIndex || 1,
                totalQuantity: result.activation?.totalQuantity || 1,
                telegramId: parsedTelegramId,
                telegramUsername: telegramUsername || null
            }
        });

    } catch (error: any) {
        console.error('Telegram connect error:', error.message);
        const status = error.message?.includes('already been claimed') ? 409 : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to connect Telegram' },
            { status }
        );
    }
}

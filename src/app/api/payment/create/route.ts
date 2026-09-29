import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, items, currency, name, email } = body;

        // Ensure keys are available
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
             throw new Error("Razorpay API keys are not configured in environment variables.");
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        // Generate a unique order ID for tracking internally
        const internalOrderId = crypto.randomUUID();

        // Generate deep link activation tokens for EVERY item in respect to quantity
        const allTelegramTokens: Array<{
            token: string;
            itemId: string;
            itemName: string;
            licenseIndex: number;
            totalQuantity: number;
            telegramId: null;
            telegramUsername: null;
            telegramConnected: boolean;
            connectedAt: null;
        }> = [];

        const processedItems = (items || []).map((item: any) => {
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            const itemTokens: any[] = [];

            for (let i = 1; i <= qty; i++) {
                // Generate a 32-byte base64url token (approx 43 chars, well within Telegram's 64-char limit)
                const token = crypto.randomBytes(32).toString('base64url');
                itemTokens.push({
                    token,
                    telegramId: null,
                    telegramUsername: null,
                    telegramConnected: false,
                    connectedAt: null,
                });

                allTelegramTokens.push({
                    token,
                    itemId: item.id || '',
                    itemName: item.name || 'Trading Tool',
                    licenseIndex: i,
                    totalQuantity: qty,
                    telegramId: null,
                    telegramUsername: null,
                    telegramConnected: false,
                    connectedAt: null,
                });
            }

            return {
                id: item.id || '',
                name: item.name || 'Trading Tool',
                price: Number(item.price) || 0,
                quantity: qty,
                telegramTokens: itemTokens,
            };
        });

        // Primary telegram token for compatibility
        const primaryTelegramToken = allTelegramTokens[0]?.token || crypto.randomBytes(32).toString('base64url');

        // Fetch real-time exchange rate, fallback to 83 if API fails
        let EXCHANGE_RATE = 83;
        try {
            const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
            const rateData = await rateRes.json();
            if (rateData && rateData.rates && rateData.rates.INR) {
                EXCHANGE_RATE = rateData.rates.INR;
            }
        } catch (err) {
            console.error('Failed to fetch real-time exchange rate, using fallback.', err);
        }

        const amountInINR = Number(amount) * EXCHANGE_RATE;

        console.log(`Creating Razorpay order for amount: ₹${amountInINR} (converted from $${amount}), currency: INR, internal_order_id: ${internalOrderId}`);

        // Razorpay expects amount in smallest currency unit (paise for INR)
        const amountInPaise = Math.round(amountInINR * 100);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: internalOrderId,
            payment_capture: 1, // Automatically capture payment
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Create a pending record in our database with razorpayOrderId linked
        await db.purchasedUsers.create({
            id: internalOrderId,
            name: name || 'Anonymous',
            email: email || 'unknown@example.com',
            items: processedItems,
            totalAmount: amount,
            status: 'pending',
            razorpayOrderId: razorpayOrder.id,
            telegramToken: primaryTelegramToken,
            telegramId: null,
            telegramConnected: false,
            telegramTokens: allTelegramTokens
        });

        // Return Razorpay order id and internal order id + telegram tokens
        return NextResponse.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            internalOrderId,
            telegramToken: primaryTelegramToken,
            telegramTokens: allTelegramTokens,
            key_id
        });

    } catch (error: any) {
        console.error('Razorpay API Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create payment',
                details: error.message || 'Error communicating with Razorpay'
            },
            { status: 500 }
        );
    }
}

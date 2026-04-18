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

        // Create a pending record in our database
        await db.purchasedUsers.create({
            id: internalOrderId,
            name: name || 'Anonymous',
            email: email || 'unknown@example.com',
            items: items || [],
            totalAmount: amount, // Keeping the original format amount for DB consistency
            status: 'pending'
        });

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

        // Return both Razorpay order id and our internal order id
        return NextResponse.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount, // this is in cents now
            internalOrderId: internalOrderId,
            key_id: key_id // send to frontend for initialization
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

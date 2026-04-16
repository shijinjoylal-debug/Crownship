import { NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, currency, order_description, name, email } = body;

        // Use the API key from environment variables
        const apiKey = process.env.NOWPAYMENTS_API_KEY;

        if (!apiKey) {
            console.error('Payment Error: NOWPAYMENTS_API_KEY is missing from environment variables.');
            return NextResponse.json(
                { error: 'Payment configuration error: API Key is not configured.' },
                { status: 500 }
            );
        }

        // Generate a unique order ID for tracking
        const orderId = crypto.randomUUID();

        // Create a pending record in our database
        await db.purchasedUsers.create({
            id: orderId,
            name: name || 'Anonymous',
            email: email || 'unknown@example.com',
            status: 'pending'
        });

        // Calculate base URL, fallback to request origin if NEXT_PUBLIC_APP_URL is missing
        const reqUrl = new URL(req.url);
        const origin = `${reqUrl.protocol}//${reqUrl.host}`;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

        console.log(`Creating NowPayments invoice for amount: ${amount}, currency: ${currency || 'usd'}, order_id: ${orderId}`);

        // Create Invoice request to NowPayments
        const response = await axios.post(
            'https://api.nowpayments.io/v1/invoice',
            {
                price_amount: amount,
                price_currency: currency || 'usd',
                order_description: order_description || 'Order Payment',
                order_id: orderId, // This will be sent back in the webhook
                ipn_callback_url: `${appUrl}/api/payment/webhook`,
                success_url: `${appUrl}/shop?payment=success`,
                cancel_url: `${appUrl}/checkout?payment=cancel`,
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        return NextResponse.json(response.data);


    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('NowPayments API Error:', JSON.stringify(errorData, null, 2));

        return NextResponse.json(
            {
                error: 'Failed to create payment',
                details: typeof errorData === 'object' ? errorData.message || JSON.stringify(errorData) : errorData
            },
            { status: 500 }
        );
    }
}

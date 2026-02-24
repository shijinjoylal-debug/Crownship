import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, currency, order_description } = body;

        // Use the API key from environment variables
        // If not set, use the provided key as a fallback (though format is suspicious)
        const apiKey = process.env.NOWPAYMENTS_API_KEY;

        if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_ACTUAL_API_KEY') {
            return NextResponse.json(
                { error: 'Payment configuration error: NOWPAYMENTS_API_KEY is not set.' },
                { status: 500 }
            );
        }

        // Calculate base URL, fallback to request origin if NEXT_PUBLIC_APP_URL is missing
        const reqUrl = new URL(req.url);
        const origin = `${reqUrl.protocol}//${reqUrl.host}`;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

        // Create Invoice request to NowPayments
        const response = await axios.post(
            'https://api.nowpayments.io/v1/invoice',
            {
                price_amount: amount,
                price_currency: currency || 'usd',
                order_description: order_description || 'Order Payment',
                ipn_callback_url: `${appUrl}/api/payment/webhook`, // Optional: for IPN
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
        console.error('NowPayments Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to create payment', details: error.response?.data || error.message },
            { status: 500 }
        );
    }
}

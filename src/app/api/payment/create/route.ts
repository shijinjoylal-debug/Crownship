import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, order_description } = body;

        // Use the API key from environment variables
        // If not set, use the provided key as a fallback (though format is suspicious)
        const apiKey = process.env.NOWPAYMENTS_API_KEY;

        if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_ACTUAL_API_KEY') {
            return NextResponse.json(
                { error: 'Payment configuration error: NOWPAYMENTS_API_KEY is not set.' },
                { status: 500 }
            );
        }

        // Create Invoice request to NowPayments
        const response = await axios.post(
            'https://api.nowpayments.io/v1/invoice',
            {
                price_amount: amount,
                price_currency: 'usd', // Assuming USD for now based on checkout page
                order_description: order_description || 'Order Payment',
                ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`, // Optional: for IPN
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?payment=success`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=cancel`,
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

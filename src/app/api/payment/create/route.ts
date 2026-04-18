import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, items, currency, name, email } = body;

        // Ensure keys are available
        const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_SezY5OFStlhUZS';
        const key_secret = process.env.RAZORPAY_KEY_SECRET || 'qS4FLeWSvFf5SuI7iTq6eJBA';

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

        console.log(`Creating Razorpay order for amount: $${amount}, currency: USD, internal_order_id: ${internalOrderId}`);

        // Razorpay expects amount in smallest currency unit (cents for USD)
        // Convert the decimal amount to integer cents
        const amountInCents = Math.round(Number(amount) * 100);

        const options = {
            amount: amountInCents,
            currency: 'USD',
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

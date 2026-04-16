import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-nowpayments-sig');

        console.log('Received NowPayments Webhook:', JSON.stringify(body, null, 2));

        // TODO: In a production environment, you should verify the signature here
        // using your NOWPAYMENTS_IPN_SECRET.

        const { payment_status, order_id } = body;

        if (payment_status === 'finished') {
            console.log(`Payment confirmed for order: ${order_id}`);
            
            if (order_id) {
                await db.purchasedUsers.updateStatus(order_id, 'confirmed');
                console.log(`Updated database status for order: ${order_id}`);
            }
        } else if (payment_status === 'failed') {
            if (order_id) {
                await db.purchasedUsers.updateStatus(order_id, 'failed');
                console.log(`Updated database status to failed for order: ${order_id}`);
            }
        }

        return NextResponse.json({ received: true });


    } catch (error: any) {
        console.error('Webhook Error:', error.message);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

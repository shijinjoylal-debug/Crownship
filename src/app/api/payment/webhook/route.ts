import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-nowpayments-sig');

        console.log('Received NowPayments Webhook:', JSON.stringify(body, null, 2));

        // TODO: In a production environment, you should verify the signature here
        // using your NOWPAYMENTS_IPN_SECRET.

        const { payment_status, order_id, purchase_id } = body;

        if (payment_status === 'finished') {
            console.log(`Payment confirmed for order: ${order_id || purchase_id}`);
            // TODO: Update your database status here
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

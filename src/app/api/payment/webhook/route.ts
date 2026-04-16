import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-nowpayments-sig');

        console.log('Received NowPayments Webhook:', JSON.stringify(body, null, 2));

        const { payment_status, order_id } = body;

        if (payment_status === 'finished' && order_id) {
            console.log(`Payment confirmed for order: ${order_id}`);
            
            // 1. Update status in database
            await db.purchasedUsers.updateStatus(order_id, 'confirmed');
            
            // 2. Fetch full order details
            const order = await db.purchasedUsers.getById(order_id);
            if (!order) {
                console.error(`Order ${order_id} not found in database.`);
            } else {
                // 3. Fetch approved users
                const approvedEmails = await db.approvedUsers.getAllEmails();
                
                if (approvedEmails.length > 0) {
                    // 4. Send notification email
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.GMAIL_USER,
                            pass: process.env.GMAIL_PASS, // App Password
                        },
                    });

                    const itemsList = order.items.map(i => `- ${i.name} (Qty: ${i.quantity}) - $${i.price}`).join('\n');
                    
                    const mailOptions = {
                        from: process.env.GMAIL_USER,
                        to: approvedEmails.join(','),
                        subject: `New Successful Purchase: ${order.name}`,
                        text: `
A new purchase has been completed successfully!

Customer Details:
-----------------
Name: ${order.name}
Email: ${order.email}
Order ID: ${order.id}

Product Details:
----------------
${itemsList}

Total Amount Paid: $${order.totalAmount}

System: Crownship
                        `,
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Notification sent to approved users: ${approvedEmails.join(', ')}`);
                } else {
                    console.log('No approved users found to notify.');
                }
            }
        } else if (payment_status === 'failed' && order_id) {
            await db.purchasedUsers.updateStatus(order_id, 'failed');
            console.log(`Updated database status to failed for order: ${order_id}`);
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

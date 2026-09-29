import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            internalOrderId
        } = body;

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!key_secret) {
             return NextResponse.json({ error: 'Server misconfiguration: missing Razorpay secret' }, { status: 500 });
        }

        // Verify the signature
        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
             console.error('Invalid Razorpay signature for order', internalOrderId);
             // Update db status to failed just in case
             if (internalOrderId) {
                 await db.purchasedUsers.updateStatus(internalOrderId, 'failed');
             }
             return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        console.log(`Payment confirmed for internal order: ${internalOrderId}`);
        
        // 1. Update status in database
        await db.purchasedUsers.updateStatus(internalOrderId, 'confirmed');
        
        // 2. Fetch full order details
        const order = await db.purchasedUsers.getById(internalOrderId);
        if (!order) {
            console.error(`Order ${internalOrderId} not found in database.`);
            return NextResponse.json({ success: true, warning: 'Order not found in db' });
        }
        const telegramUsername = process.env.TELEGRAM_BOT_USERNAME || 'RISK_CALCUKATORbot';

        // Build deep links for EVERY item in respect to quantity
        const telegramTokens = (order.telegramTokens && order.telegramTokens.length > 0)
            ? order.telegramTokens
            : (order.telegramToken ? [{
                token: order.telegramToken,
                itemId: order.items?.[0]?.id || '',
                itemName: order.items?.[0]?.name || 'Trading Tool',
                licenseIndex: 1,
                totalQuantity: 1,
                telegramConnected: false
            }] : []);

        const telegramLinks = telegramTokens.map((t: any) => ({
            token: t.token,
            itemId: t.itemId || '',
            itemName: t.itemName,
            licenseIndex: t.licenseIndex || 1,
            totalQuantity: t.totalQuantity || 1,
            telegramConnected: !!t.telegramConnected,
            link: `https://t.me/${telegramUsername}?start=${t.token}`
        }));

        const primaryTelegramLink = telegramLinks[0]?.link || `https://t.me/${telegramUsername}?start=${order.telegramToken}`;

        // 3. Fetch approved users and send notification email (non-blocking for response)
        try {
            const approvedEmails = await db.approvedUsers.getAllEmails();
            
            if (approvedEmails.length > 0 && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASS,
                    },
                });

                const itemsList = order.items.map((i: any) => `- ${i.name} (Qty: ${i.quantity}) - $${i.price.toFixed(2)}`).join('\n');
                const licenseLinksList = telegramLinks
                    .map((l: any) => `• ${l.itemName} (License #${l.licenseIndex} of ${l.totalQuantity}): ${l.link}`)
                    .join('\n');
                
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
Razorpay Payment ID: ${razorpay_payment_id}

Product Details:
----------------
${itemsList}

Telegram Deep Links (${telegramLinks.length} total licenses):
-------------------------------------------------------------
${licenseLinksList}

Total Amount Paid: $${order.totalAmount.toFixed(2)}

System: Crownship
                    `,
                };

                await transporter.sendMail(mailOptions);
                console.log(`Notification sent to approved users: ${approvedEmails.join(', ')}`);
            } else {
                console.log('No approved emails or Gmail credentials not configured. Skipping email notification.');
            }
        } catch (emailErr: any) {
            console.error('Failed to send purchase notification email:', emailErr.message);
        }

        return NextResponse.json({
            success: true,
            telegramUsername,
            telegramLink: primaryTelegramLink,
            telegramLinks
        });

    } catch (error: any) {
        console.error('Verify Route Error:', error.message);
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}

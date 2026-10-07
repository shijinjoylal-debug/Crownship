import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
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
            internalOrderId,
        } = body;

        // Validate required parameters
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !internalOrderId
        ) {
            return NextResponse.json(
                { error: 'Missing required payment verification parameters' },
                { status: 400 }
            );
        }

        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            return NextResponse.json(
                { error: 'Server misconfiguration: missing Razorpay API credentials' },
                { status: 500 }
            );
        }

        // 1. Verify Razorpay HMAC signature using timing-safe comparison
        const expected_signature = crypto
            .createHmac('sha256', key_secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const expectedBuf = Buffer.from(expected_signature, 'utf-8');
        const signatureBuf = Buffer.from(razorpay_signature, 'utf-8');

        if (
            expectedBuf.length !== signatureBuf.length ||
            !crypto.timingSafeEqual(expectedBuf, signatureBuf)
        ) {
            console.error(`Invalid Razorpay signature for internal order: ${internalOrderId}`);
            await db.purchasedUsers.updateStatus(internalOrderId, 'failed');
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // 2. Verify the internal Crownship order exists in MongoDB
        const order = await db.purchasedUsers.getById(internalOrderId);
        if (!order) {
            console.error(`Internal order ${internalOrderId} not found in database.`);
            return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
        }

        // 3. Verify the Razorpay order ID matches the order stored in MongoDB
        if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
            console.error(
                `Razorpay order ID mismatch: stored=${order.razorpayOrderId}, received=${razorpay_order_id}`
            );
            return NextResponse.json({ error: 'Razorpay order ID mismatch' }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id,
            key_secret,
        });

        // 4. Fetch the Razorpay order using the Razorpay API
        let rzpOrder: any;
        try {
            rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        } catch (err: any) {
            console.error(`Failed to fetch Razorpay order ${razorpay_order_id}:`, err.message);
            return NextResponse.json(
                { error: 'Failed to fetch order details from payment gateway' },
                { status: 502 }
            );
        }

        // 5. Verify the Razorpay receipt corresponds to the Crownship internal order ID
        if (rzpOrder.receipt !== internalOrderId) {
            console.error(
                `Receipt mismatch: rzp=${rzpOrder.receipt}, internal=${internalOrderId}`
            );
            return NextResponse.json({ error: 'Order receipt mismatch' }, { status: 400 });
        }

        // 6. Verify the Razorpay amount matches the amount stored for that order
        if (order.razorpayAmount && Number(rzpOrder.amount) !== Number(order.razorpayAmount)) {
            console.error(
                `Amount mismatch: stored=${order.razorpayAmount}, rzp=${rzpOrder.amount}`
            );
            return NextResponse.json({ error: 'Order amount mismatch' }, { status: 400 });
        }

        // 7. Fetch the Razorpay payment using Razorpay API
        let rzpPayment: any;
        try {
            rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (err: any) {
            console.error(`Failed to fetch Razorpay payment ${razorpay_payment_id}:`, err.message);
            return NextResponse.json(
                { error: 'Failed to fetch payment details from payment gateway' },
                { status: 502 }
            );
        }

        // 8. Verify payment.order_id equals razorpay_order_id
        if (rzpPayment.order_id !== razorpay_order_id) {
            console.error(
                `Payment order_id mismatch: payment.order_id=${rzpPayment.order_id}, razorpay_order_id=${razorpay_order_id}`
            );
            return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
        }

        // 9. Verify payment amount matches the Razorpay order amount
        if (Number(rzpPayment.amount) !== Number(rzpOrder.amount)) {
            console.error(
                `Payment amount mismatch: payment=${rzpPayment.amount}, order=${rzpOrder.amount}`
            );
            return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
        }

        // 10. Verify currency is INR
        if (rzpPayment.currency !== 'INR') {
            console.error(`Currency mismatch: payment=${rzpPayment.currency}, expected INR`);
            return NextResponse.json({ error: 'Payment currency must be INR' }, { status: 400 });
        }

        // 11. Verify payment status is captured
        if (rzpPayment.status !== 'captured') {
            console.error(`Payment not captured. Status: ${rzpPayment.status}`);
            return NextResponse.json(
                { error: `Payment not captured (current status: ${rzpPayment.status})` },
                { status: 400 }
            );
        }

        const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'CrownshipBot').replace(/^@/, '');
        const alreadyConfirmed = order.status === 'confirmed';

        // 12. Only then mark Crownship purchase as confirmed (idempotent check)
        if (!alreadyConfirmed) {
            await db.purchasedUsers.updateConfirmed(internalOrderId, {
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpayAmount: Number(rzpPayment.amount),
            });

            console.log(`Payment verified & confirmed for order: ${internalOrderId}`);

            // Generate exactly one activation token per purchased quantity
            const activationRecords: Array<{
                id: string;
                token: string;
                orderId: string;
                productId: string;
                productName: string;
                licenseIndex: number;
                totalQuantity: number;
                telegramId: null;
                status: 'unused';
                usedAt: null;
            }> = [];

            for (const item of (order.items || [])) {
                const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
                for (let i = 1; i <= qty; i++) {
                    const token = crypto.randomBytes(32).toString('base64url');
                    activationRecords.push({
                        id: crypto.randomUUID(),
                        token,
                        orderId: internalOrderId,
                        productId: item.id || '',
                        productName: item.name || 'Trading Tool',
                        licenseIndex: i,
                        totalQuantity: qty,
                        telegramId: null,
                        status: 'unused',
                        usedAt: null,
                    });
                }
            }

            if (activationRecords.length > 0) {
                await db.activations.createBatch(activationRecords);
            }

            // Send notification email only on the first confirmation
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

                    const itemsList = (order.items || [])
                        .map((i: any) => `- ${i.name} (Qty: ${i.quantity}) - $${Number(i.price).toFixed(2)}`)
                        .join('\n');

                    const mailOptions = {
                        from: process.env.GMAIL_USER,
                        to: approvedEmails.join(','),
                        subject: `New Successful Purchase: ${order.name}`,
                        text: `
A new purchase has been completed successfully!

Customer Details:
-----------------
Customer Name: ${order.name}
Customer Email: ${order.email}
Crownship Order ID: ${order.id}
Razorpay Order ID: ${razorpay_order_id}
Razorpay Payment ID: ${razorpay_payment_id}

Purchased Products:
-------------------
${itemsList}

Total Amount: $${Number(order.totalAmount).toFixed(2)} (₹${(Number(rzpPayment.amount) / 100).toFixed(2)})

System: Crownship
                        `.trim(),
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Notification sent to approved users: ${approvedEmails.join(', ')}`);
                }
            } catch (emailErr: any) {
                console.error('Failed to send purchase notification email:', emailErr.message);
            }
        }

        // Retrieve unused activation records for this order
        const unusedActivations = await db.activations.getUnusedByOrderId(internalOrderId);

        // Format activations for response
        const formattedActivations = unusedActivations.map(act => ({
            productName: act.productName,
            activationUrl: `https://t.me/${botUsername}?start=${act.token}`,
            licenseIndex: act.licenseIndex || 1,
            totalQuantity: act.totalQuantity || 1,
            token: act.token,
        }));

        // Fallback for legacy orders if activations collection was empty
        if (formattedActivations.length === 0 && alreadyConfirmed) {
            if (order.telegramTokens && order.telegramTokens.length > 0) {
                order.telegramTokens
                    .filter((t: any) => !t.telegramConnected)
                    .forEach((t: any) => {
                        formattedActivations.push({
                            productName: t.itemName,
                            activationUrl: `https://t.me/${botUsername}?start=${t.token}`,
                            licenseIndex: t.licenseIndex || 1,
                            totalQuantity: t.totalQuantity || 1,
                            token: t.token,
                        });
                    });
            } else if (order.telegramToken && !order.telegramConnected) {
                formattedActivations.push({
                    productName: order.items?.[0]?.name || 'Trading Tool',
                    activationUrl: `https://t.me/${botUsername}?start=${order.telegramToken}`,
                    licenseIndex: 1,
                    totalQuantity: 1,
                    token: order.telegramToken,
                });
            }
        }

        return NextResponse.json({
            success: true,
            activations: formattedActivations.map(a => ({
                productName: a.productName,
                activationUrl: a.activationUrl,
            })),
            // Backward compatibility fields
            telegramLinks: formattedActivations.map(a => ({
                token: a.token,
                itemName: a.productName,
                licenseIndex: a.licenseIndex,
                totalQuantity: a.totalQuantity,
                link: a.activationUrl,
            })),
            telegramLink: formattedActivations[0]?.activationUrl || '',
            telegramUsername: botUsername,
        });

    } catch (error: any) {
        console.error('Verify Route Error:', error);
        return NextResponse.json(
            { error: 'Payment verification failed', details: error.message },
            { status: 500 }
        );
    }
}
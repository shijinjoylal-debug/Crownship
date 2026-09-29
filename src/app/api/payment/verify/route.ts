import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';

export async function POST(req: Request) {

    try {

        const body = await req.json();

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            internalOrderId
        } = body;

        // ============================================
        // Validate request
        // ============================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !internalOrderId
        ) {
            return NextResponse.json(
                {
                    error: 'Missing payment verification data'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Razorpay credentials
        // ============================================

        const key_id =
            process.env.RAZORPAY_KEY_ID;

        const key_secret =
            process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            return NextResponse.json(
                {
                    error:
                        'Server misconfiguration: missing Razorpay credentials'
                },
                {
                    status: 500
                }
            );
        }

        const razorpay = new Razorpay({
            key_id,
            key_secret,
        });

        // ============================================
        // Get our internal Crownship order
        // ============================================

        const order =
            await db.purchasedUsers.getById(
                internalOrderId
            );

        if (!order) {

            console.error(
                `Order ${internalOrderId} not found`
            );

            return NextResponse.json(
                {
                    error: 'Crownship order not found'
                },
                {
                    status: 404
                }
            );
        }

        // ============================================
        // Check Razorpay order ID matches
        // ============================================

        if (
            order.razorpayOrderId &&
            order.razorpayOrderId !==
            razorpay_order_id
        ) {

            console.error(
                'Razorpay order ID mismatch',
                {
                    internalOrderId,
                    stored:
                        order.razorpayOrderId,
                    received:
                        razorpay_order_id
                }
            );

            return NextResponse.json(
                {
                    error:
                        'Razorpay order does not match Crownship order'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Verify Razorpay signature
        // ============================================

        const generatedSignature =
            crypto
                .createHmac(
                    'sha256',
                    key_secret
                )
                .update(
                    razorpay_order_id +
                    '|' +
                    razorpay_payment_id
                )
                .digest('hex');

        const signaturesMatch =
            generatedSignature.length ===
            razorpay_signature.length &&
            crypto.timingSafeEqual(
                Buffer.from(generatedSignature),
                Buffer.from(razorpay_signature)
            );

        if (!signaturesMatch) {

            console.error(
                'Invalid Razorpay signature',
                internalOrderId
            );

            await db.purchasedUsers.updateStatus(
                internalOrderId,
                'failed'
            );

            return NextResponse.json(
                {
                    error:
                        'Invalid payment signature'
                },
                {
                    status: 400
                }
            );
        }

        console.log(
            `Razorpay signature verified: ${internalOrderId}`
        );

        // ============================================
        // Fetch Razorpay order directly
        // ============================================

        const razorpayOrder =
            await razorpay.orders.fetch(
                razorpay_order_id
            );

        // ============================================
        // Verify Razorpay receipt
        // ============================================

        if (
            razorpayOrder.receipt !==
            internalOrderId
        ) {

            console.error(
                'Razorpay receipt mismatch'
            );

            return NextResponse.json(
                {
                    error:
                        'Razorpay receipt verification failed'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Verify amount
        // ============================================

        const expectedAmount =
            Math.round(
                Number(order.totalAmount) *
                await getExchangeRate()
                * 100
            );

        /*
         * NOTE:
         * The exchange rate can change between
         * create and verify.
         *
         * Therefore, we DON'T use the newly fetched
         * exchange rate as the final comparison.
         *
         * The Razorpay order itself is the source
         * of truth for the amount that was created.
         */

        if (
            Number(razorpayOrder.amount) <= 0
        ) {

            return NextResponse.json(
                {
                    error:
                        'Invalid Razorpay order amount'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Verify currency
        // ============================================

        if (
            razorpayOrder.currency !== 'INR'
        ) {

            console.error(
                'Unexpected Razorpay currency:',
                razorpayOrder.currency
            );

            return NextResponse.json(
                {
                    error:
                        'Unexpected payment currency'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Fetch actual payment from Razorpay
        // ============================================

        const razorpayPayment =
            await razorpay.payments.fetch(
                razorpay_payment_id
            );

        // ============================================
        // Verify payment belongs to order
        // ============================================

        if (
            razorpayPayment.order_id !==
            razorpay_order_id
        ) {

            console.error(
                'Payment/order mismatch'
            );

            return NextResponse.json(
                {
                    error:
                        'Payment does not belong to this order'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Verify payment amount
        // ============================================

        if (
            Number(razorpayPayment.amount) !==
            Number(razorpayOrder.amount)
        ) {

            console.error(
                'Payment amount mismatch'
            );

            return NextResponse.json(
                {
                    error:
                        'Payment amount mismatch'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Verify payment currency
        // ============================================

        if (
            razorpayPayment.currency !==
            razorpayOrder.currency
        ) {

            return NextResponse.json(
                {
                    error:
                        'Payment currency mismatch'
                },
                {
                    status: 400
                }
            );
        }

        // ============================================
        // Verify captured payment
        // ============================================

        if (
            razorpayPayment.status !==
            'captured'
        ) {

            console.error(
                'Payment not captured:',
                razorpayPayment.status
            );

            return NextResponse.json(
                {
                    error:
                        'Payment has not been captured'
                },
                {
                    status: 400
                }
            );
        }

        console.log(
            `Payment fully verified: ${internalOrderId}`
        );

        // ============================================
        // Build deep links for EVERY item in respect to quantity
        // ============================================

        const telegramUsername =
            process.env.TELEGRAM_BOT_USERNAME || 'RISK_CALCUKATORbot';

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

        const primaryTelegramLink = telegramLinks[0]?.link || (order.telegramToken ? `https://t.me/${telegramUsername}?start=${order.telegramToken}` : null);

        // ============================================
        // Handle already-confirmed order
        // ============================================

        if (order.status === 'confirmed') {
            return NextResponse.json({
                success: true,
                alreadyConfirmed: true,
                telegramUsername,
                telegramLink: primaryTelegramLink,
                telegramLinks
            });
        }

        // ============================================
        // Mark order confirmed
        // ============================================

        await db.purchasedUsers.updateStatus(
            internalOrderId,
            'confirmed',
            razorpay_payment_id
        );

        // ============================================
        // Email notification
        // ============================================

        try {
            const approvedEmails =
                await db.approvedUsers.getAllEmails();

            if (
                approvedEmails.length > 0 &&
                process.env.GMAIL_USER &&
                process.env.GMAIL_PASS
            ) {

                const transporter =
                    nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user:
                                process.env.GMAIL_USER,
                            pass:
                                process.env.GMAIL_PASS,
                        },
                    });

                const itemsList =
                    order.items
                        .map(
                            (i: any) =>
                                `- ${i.name} ` +
                                `(Qty: ${i.quantity}) ` +
                                `- $${Number(i.price).toFixed(2)}`
                        )
                        .join('\n');

                const licenseLinksList = telegramLinks
                    .map(
                        (l: any) =>
                            `• ${l.itemName} (License #${l.licenseIndex} of ${l.totalQuantity}): ${l.link}`
                    )
                    .join('\n');

                const mailOptions = {

                    from:
                        process.env.GMAIL_USER,

                    to:
                        approvedEmails.join(','),

                    subject:
                        `New Successful Purchase: ${order.name}`,

                    text: `
A new purchase has been completed successfully!

Customer Details:
-----------------
Name: ${order.name}
Email: ${order.email}
Order ID: ${order.id}
Razorpay Order ID: ${razorpay_order_id}
Razorpay Payment ID: ${razorpay_payment_id}

Product Details:
----------------
${itemsList}

Total Amount:
$${Number(order.totalAmount).toFixed(2)}

Telegram Deep Links (${telegramLinks.length} total licenses):
-------------------------------------------------------------
${licenseLinksList || primaryTelegramLink || 'Telegram activation link unavailable'}

System: Crownship
                    `,
                };

                await transporter.sendMail(
                    mailOptions
                );

                console.log(
                    `Purchase notification sent to: ` +
                    `${approvedEmails.join(', ')}`
                );
            }
        } catch (emailErr: any) {
            console.error('Failed to send purchase notification email:', emailErr.message);
        }

        // ============================================
        // SUCCESS
        // ============================================

        return NextResponse.json({
            success: true,
            telegramUsername,
            telegramLink: primaryTelegramLink,
            telegramLinks
        });

    } catch (error: any) {

        console.error(
            'Payment Verification Error:',
            error
        );

        return NextResponse.json(
            {
                error:
                    'Payment verification failed',
                details:
                    error?.message ||
                    'Unknown verification error'
            },
            {
                status: 500
            }
        );
    }
}


// ==================================================
// Helper
// ==================================================

async function getExchangeRate(): Promise<number> {

    try {

        const rateRes = await fetch(
            'https://open.er-api.com/v6/latest/USD',
            {
                cache: 'no-store'
            }
        );

        if (rateRes.ok) {

            const rateData =
                await rateRes.json();

            if (
                rateData?.rates?.INR
            ) {
                return Number(
                    rateData.rates.INR
                );
            }
        }

    } catch (error) {

        console.error(
            'Exchange rate fetch failed:',
            error
        );
    }

    return 83;
}
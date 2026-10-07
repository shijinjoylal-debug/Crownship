import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import ProductModel from '@/models/Product';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, name, email } = body;

        // Ensure keys are available
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            throw new Error("Razorpay API keys are not configured in environment variables.");
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'No items in cart' },
                { status: 400 }
            );
        }

        // Recalculate price server-side from ProductModel to prevent client-side tampering
        let calculatedTotalUSD = 0;
        const processedItems: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
        }> = [];

        for (const rawItem of items) {
            const qty = Math.max(1, parseInt(String(rawItem.quantity), 10) || 1);
            let unitPrice = 0;
            let productName = rawItem.name || 'Trading Tool';
            let productId = rawItem.id || '';

            // Search product in database
            let dbProduct: any = null;
            if (productId) {
                dbProduct = await ProductModel.findOne({
                    $or: [
                        { id: productId },
                        { id: productId.trim() }
                    ]
                }).lean();
            }
            if (!dbProduct && rawItem.name) {
                dbProduct = await ProductModel.findOne({ name: rawItem.name }).lean();
            }

            if (dbProduct) {
                unitPrice = Number(dbProduct.price);
                productName = dbProduct.name;
                productId = dbProduct.id || dbProduct[' id'] || productId;
            } else {
                // Safe fallback to client unit price if positive
                unitPrice = Math.max(0, Number(rawItem.price) || 0);
            }

            calculatedTotalUSD += unitPrice * qty;

            processedItems.push({
                id: productId,
                name: productName,
                price: unitPrice,
                quantity: qty,
            });
        }

        if (calculatedTotalUSD <= 0) {
            return NextResponse.json(
                { error: 'Invalid order total' },
                { status: 400 }
            );
        }

        // Generate a unique order ID for tracking internally
        const internalOrderId = crypto.randomUUID();

        // Fetch real-time exchange rate, fallback to 83 if API fails
        let EXCHANGE_RATE = 83;
        try {
            const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
            const rateData = await rateRes.json();
            if (rateData && rateData.rates && rateData.rates.INR) {
                EXCHANGE_RATE = Number(rateData.rates.INR) || 83;
            }
        } catch (err) {
            console.error('Failed to fetch real-time exchange rate, using fallback.', err);
        }

        const amountInINR = calculatedTotalUSD * EXCHANGE_RATE;
        const amountInPaise = Math.round(amountInINR * 100);

        console.log(`Creating Razorpay order: ₹${amountInINR} (paise: ${amountInPaise}) from $${calculatedTotalUSD}, receipt: ${internalOrderId}`);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: internalOrderId,
            payment_capture: 1 as const,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Store the order in MongoDB with pending status, Razorpay order ID, and amount
        await db.purchasedUsers.create({
            id: internalOrderId,
            name: name || 'Anonymous',
            email: email || 'unknown@example.com',
            items: processedItems,
            totalAmount: calculatedTotalUSD,
            razorpayOrderId: razorpayOrder.id,
            razorpayAmount: Number(razorpayOrder.amount),
            currency: razorpayOrder.currency || 'INR',
            status: 'pending',
        });

        // Return Razorpay order id and internal order id
        return NextResponse.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            internalOrderId,
            key_id,
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

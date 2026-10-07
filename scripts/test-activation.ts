import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import crypto from 'crypto';
import TelegramActivationModel from '../src/models/TelegramActivation';
import PurchasedUserModel from '../src/models/PurchasedUser';
import ProductModel from '../src/models/Product';

async function runTests() {
    console.log('--- STARTING TELEGRAM ACTIVATION SYSTEM TESTS ---');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI missing');
    }

    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');

    const testOrderId = `test-order-${crypto.randomUUID()}`;
    const token1 = crypto.randomBytes(32).toString('base64url');
    const token2 = crypto.randomBytes(32).toString('base64url');
    const token3 = crypto.randomBytes(32).toString('base64url');

    try {
        // Test 1: Create confirmed purchase order
        console.log('\n[Test 1] Creating test confirmed purchase order...');
        const order = await PurchasedUserModel.create({
            id: testOrderId,
            name: 'Test Customer',
            email: 'test@example.com',
            items: [
                { id: 'tool-1', name: 'Telegram Trading Bot', price: 10, quantity: 2 },
                { id: 'tool-2', name: 'Crypto Analytics', price: 1, quantity: 1 }
            ],
            totalAmount: 21,
            razorpayOrderId: 'order_test_123',
            razorpayPaymentId: 'pay_test_456',
            razorpayAmount: 210000,
            status: 'confirmed'
        });
        console.log('✓ Confirmed test order created:', order.id);

        // Test 2: Quantity-based activation generation (2 + 1 = 3 tokens)
        console.log('\n[Test 2] Creating 3 quantity-based TelegramActivation records...');
        const activationsToInsert = [
            {
                id: crypto.randomUUID(),
                token: token1,
                orderId: testOrderId,
                productId: 'tool-1',
                productName: 'Telegram Trading Bot',
                licenseIndex: 1,
                totalQuantity: 2,
                status: 'unused' as const,
                telegramId: null,
                usedAt: null
            },
            {
                id: crypto.randomUUID(),
                token: token2,
                orderId: testOrderId,
                productId: 'tool-1',
                productName: 'Telegram Trading Bot',
                licenseIndex: 2,
                totalQuantity: 2,
                status: 'unused' as const,
                telegramId: null,
                usedAt: null
            },
            {
                id: crypto.randomUUID(),
                token: token3,
                orderId: testOrderId,
                productId: 'tool-2',
                productName: 'Crypto Analytics',
                licenseIndex: 1,
                totalQuantity: 1,
                status: 'unused' as const,
                telegramId: null,
                usedAt: null
            }
        ];

        await TelegramActivationModel.insertMany(activationsToInsert);
        const storedActs = await TelegramActivationModel.find({ orderId: testOrderId });
        console.log(`✓ Stored activations count: ${storedActs.length} (expected 3)`);
        if (storedActs.length !== 3) throw new Error('Expected 3 activations');

        // Test 3: Token uniqueness index
        console.log('\n[Test 3] Verifying unique index on token...');
        let uniqueFailed = false;
        try {
            await TelegramActivationModel.create({
                id: crypto.randomUUID(),
                token: token1, // Duplicate token!
                orderId: testOrderId,
                productName: 'Duplicate Test',
                status: 'unused'
            });
        } catch (err: any) {
            uniqueFailed = true;
            console.log('✓ Duplicate token correctly rejected by MongoDB unique index:', err.message);
        }
        if (!uniqueFailed) throw new Error('Unique token constraint failed to trigger!');

        // Test 4: First atomic redemption
        console.log('\n[Test 4] Atomic redemption of token 1...');
        const userTgId1 = 123456789;
        const redeemed1 = await TelegramActivationModel.findOneAndUpdate(
            { token: token1, status: 'unused' },
            { $set: { status: 'used', telegramId: userTgId1, usedAt: new Date() } },
            { new: true }
        );
        console.log(`✓ Redeemed 1: status=${redeemed1?.status}, telegramId=${redeemed1?.telegramId}`);
        if (!redeemed1 || redeemed1.status !== 'used') throw new Error('Failed to redeem token 1');

        // Test 5: Re-redemption attempt of already-used token
        console.log('\n[Test 5] Attempting duplicate redemption of token 1...');
        const userTgIdDuplicate = 987654321;
        const duplicateRedeem = await TelegramActivationModel.findOneAndUpdate(
            { token: token1, status: 'unused' },
            { $set: { status: 'used', telegramId: userTgIdDuplicate, usedAt: new Date() } },
            { new: true }
        );
        console.log(`✓ Duplicate redemption result: ${duplicateRedeem} (expected null)`);
        if (duplicateRedeem !== null) throw new Error('Duplicate token redemption was NOT rejected!');

        // Test 6: Race condition simulation on token 2 (concurrent redemption)
        console.log('\n[Test 6] Simulating concurrent race condition on token 2...');
        const [race1, race2] = await Promise.all([
            TelegramActivationModel.findOneAndUpdate(
                { token: token2, status: 'unused' },
                { $set: { status: 'used', telegramId: 111111, usedAt: new Date() } },
                { new: true }
            ),
            TelegramActivationModel.findOneAndUpdate(
                { token: token2, status: 'unused' },
                { $set: { status: 'used', telegramId: 222222, usedAt: new Date() } },
                { new: true }
            )
        ]);

        const successfulRaces = [race1, race2].filter(Boolean);
        console.log(`✓ Concurrent race winners: ${successfulRaces.length} (exactly 1 expected)`);
        if (successfulRaces.length !== 1) {
            throw new Error(`Race condition flaw! Expected exactly 1 winner, got ${successfulRaces.length}`);
        }

        // Test 7: Unused tokens retrieval (idempotent verify behavior)
        console.log('\n[Test 7] Checking unused activations remaining for order...');
        const remainingUnused = await TelegramActivationModel.find({ orderId: testOrderId, status: 'unused' });
        console.log(`✓ Remaining unused tokens: ${remainingUnused.length} (expected 1: token 3)`);
        if (remainingUnused.length !== 1 || remainingUnused[0].token !== token3) {
            throw new Error('Unused tokens query incorrect');
        }

        console.log('\n========================================');
        console.log('✅ ALL ACTIVATION TESTS PASSED PERFECTLY!');
        console.log('========================================');

    } finally {
        // Clean up test records
        await TelegramActivationModel.deleteMany({ orderId: testOrderId });
        await PurchasedUserModel.deleteOne({ id: testOrderId });
        await mongoose.disconnect();
        console.log('✓ Cleaned up test data and disconnected');
    }
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

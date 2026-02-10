"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function CheckoutPage() {
    const { total, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Call our internal API to create a payment invoice
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: total,
                    order_description: `Order for ${total} USD`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || 'Payment creation failed');
            }

            if (data.invoice_url) {
                // Redirect user to NowPayments checkout
                window.location.href = data.invoice_url;
            } else {
                throw new Error('No invoice URL returned from payment provider');
            }

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Payment execution failed. Please check console for details.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.successState}>
                <div className="container">
                    <div className={styles.checkIcon}>✓</div>
                    <h1>Payment Successful</h1>
                    <p>Your access keys have been sent to your email.</p>
                    <button onClick={() => router.push('/shop')} className="btn-primary" style={{ marginTop: '20px' }}>
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <h1 className={styles.title}>Secure Checkout</h1>

                <div className={styles.grid}>
                    <form className={`glass-panel ${styles.form}`} onSubmit={handleSubmit}>
                        <h2>Billing Details</h2>

                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input type="text" required placeholder=" full name" />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input type="email" required placeholder="name@example.com" />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Card Number</label>
                            <input type="text" required placeholder="0000 0000 0000 0000" />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>Expiry</label>
                                <input type="text" required placeholder="MM/YY" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>CVC</label>
                                <input type="text" required placeholder="123" />
                            </div>
                        </div>

                        <div className={styles.totalRow}>
                            <span>Total to Pay:</span>
                            <span>${total}</span>
                        </div>

                        <button type="submit" disabled={loading} className={styles.payBtn}>
                            {loading ? 'Processing...' : `Pay Now $${total}`}
                        </button>
                        <p className={styles.secureText}>🔒 128-bit SSL Encrypted Payment</p>
                    </form>

                    <div className={styles.sidebar}>
                        <div className={`glass-panel ${styles.trustPanel}`}>
                            <h3>Why Crownship?</h3>
                            <ul>
                                <li>Instant License Activation</li>
                                <li>24/7 Institutional Support</li>
                                <li>30-Day Money Back Guarantee</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Call our internal API to create a payment invoice
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: total,
                    items: items.map(i => ({
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity
                    })),
                    order_description: `Order for ${items.length} item(s)`,
                    name,
                    email,
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

        } catch (error: any) {
            console.error('Checkout error:', error);
            setError(error.message || 'Payment execution failed. Please try again.');
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
                            <input 
                                type="text" 
                                required 
                                placeholder="Your full name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className={styles.errorMessage} style={{ color: '#ff4b4b', marginBottom: '15px', padding: '10px', background: 'rgba(255, 75, 75, 0.1)', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className={styles.totalRow}>
                            <span>Total to Pay:</span>
                            <span>${total}</span>
                        </div>

                        <button type="submit" disabled={loading} className={styles.payBtn}>
                            {loading ? 'Processing...' : `Pay Now $${total}`}
                        </button>
                        <p className={styles.secureText}>🔒 Secure Crypto Payment via NowPayments</p>
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

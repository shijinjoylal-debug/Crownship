"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exchangeRate, setExchangeRate] = useState(83);

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (data && data.rates && data.rates.INR) {
                    setExchangeRate(data.rates.INR);
                }
            })
            .catch(err => console.error('Failed to fetch exchange rate', err));
    }, []);

    const initializeRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Load razorpay script
            const res = await initializeRazorpay();
            if (!res) {
                throw new Error("Razorpay SDK failed to load. Are you online?");
            }

            // Call our internal API to create a payment invoice/order
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
                    name,
                    email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || 'Payment creation failed');
            }

            if (data.id) {
                // Initialize Razorpay
                const options = {
                    key: data.key_id,
                    amount: data.amount,
                    currency: data.currency,
                    name: "Crownship",
                    description: `Order for ${items.length} item(s)`,
                    order_id: data.id,
                    handler: async function (response: any) {
                        try {
                            setLoading(true);
                            // Verify payment on our server
                            const verifyRes = await fetch('/api/payment/verify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    internalOrderId: data.internalOrderId
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyRes.ok && verifyData.success) {
                                clearCart();
                                setSuccess(true);
                            } else {
                                setError('Payment verification failed. Please contact support.');
                            }
                            setLoading(false);

                        } catch (err: any) {
                            setError('Verification request failed.');
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: name,
                        email: email,
                    },
                    theme: {
                        color: "#3399cc",
                    },
                    modal: {
                        ondismiss: function() {
                            setLoading(false);
                            setError("Payment cancelled by user. You can try again.");
                        }
                    }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (response: any) {
                    setError(`Payment failed: ${response.error.description}`);
                    setLoading(false);
                });
                paymentObject.open();

            } else {
                throw new Error('No order ID returned from payment provider');
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
                    <p>Your purchase has been processed successfully. Check your email(DM) for tool activation.</p>
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
                            <div style={{ textAlign: 'right' }}>
                                <span>${total}</span>
                                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                                    (approx. ₹{(total * exchangeRate).toFixed(2)})
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className={styles.payBtn}>
                            {loading ? 'Processing...' : `Pay Now $${total}`}
                        </button>
                        <p className={styles.secureText}>🔒 Secure Payment via Razorpay (Supports UPI)</p>
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

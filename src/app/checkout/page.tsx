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

interface ActivationItem {
    productName: string;
    activationUrl: string;
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
    const [activations, setActivations] = useState<ActivationItem[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (data && data.rates && data.rates.INR) {
                    setExchangeRate(Number(data.rates.INR) || 83);
                }
            })
            .catch(err => console.error('Failed to fetch exchange rate', err));
    }, []);

    const initializeRazorpay = () => {
        return new Promise<boolean>((resolve) => {
            if (window.Razorpay) {
                return resolve(true);
            }
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

    const handleCopy = (link: string, index: number) => {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(link);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Load Razorpay SDK
            const sdkLoaded = await initializeRazorpay();
            if (!sdkLoaded) {
                throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
            }

            // Call our internal API to create a payment order
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: total,
                    items: items.map(i => ({
                        id: i.id,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                    })),
                    name,
                    email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Payment creation failed');
            }

            if (data.id) {
                const options = {
                    key: data.key_id,
                    amount: data.amount,
                    currency: data.currency,
                    name: "Crownship",
                    description: `Order for ${items.length} item(s)`,
                    order_id: data.id,
                    handler: async function (paymentResponse: any) {
                        try {
                            setLoading(true);
                            // Verify payment on our server
                            const verifyRes = await fetch('/api/payment/verify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: paymentResponse.razorpay_order_id,
                                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                    razorpay_signature: paymentResponse.razorpay_signature,
                                    internalOrderId: data.internalOrderId,
                                }),
                            });

                            const verifyData = await verifyRes.json();

                            if (verifyRes.ok && verifyData.success) {
                                clearCart();

                                // Extract activations from response
                                const receivedActivations: ActivationItem[] = [];
                                if (Array.isArray(verifyData.activations) && verifyData.activations.length > 0) {
                                    verifyData.activations.forEach((act: any) => {
                                        receivedActivations.push({
                                            productName: act.productName || 'Trading Tool',
                                            activationUrl: act.activationUrl,
                                        });
                                    });
                                } else if (Array.isArray(verifyData.telegramLinks) && verifyData.telegramLinks.length > 0) {
                                    verifyData.telegramLinks.forEach((linkObj: any) => {
                                        receivedActivations.push({
                                            productName: linkObj.itemName || linkObj.productName || 'Trading Tool',
                                            activationUrl: linkObj.link || linkObj.activationUrl,
                                        });
                                    });
                                } else if (verifyData.telegramLink) {
                                    receivedActivations.push({
                                        productName: 'Trading Tool',
                                        activationUrl: verifyData.telegramLink,
                                    });
                                }

                                setActivations(receivedActivations);
                                setSuccess(true);
                            } else {
                                setError(verifyData.error || 'Payment verification failed. Please contact support.');
                            }
                            setLoading(false);

                        } catch (err: any) {
                            console.error('Verification error:', err);
                            setError('Verification request failed. Please contact support.');
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
                        ondismiss: function () {
                            setLoading(false);
                            setError("Payment cancelled. You can try again.");
                        },
                    },
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (failResponse: any) {
                    setError(`Payment failed: ${failResponse.error?.description || 'Transaction error'}`);
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
                <div className="container" style={{ maxWidth: '750px', margin: '0 auto', padding: '20px' }}>
                    <div className={styles.checkIcon}>✓</div>
                    <h1 style={{ fontSize: '2.4rem', marginBottom: '10px' }}>Payment Successful</h1>
                    <p style={{ color: '#bbb', fontSize: '1.05rem', marginBottom: '32px' }}>
                        Your payment has been successfully verified.
                    </p>

                    {activations.length > 0 && (
                        <div className={styles.activationCard}>
                            <h3 className={styles.activationHeader}>
                                Activate your purchased Telegram tools:
                            </h3>
                            <p className={styles.activationNotice}>
                                Each activation link can be used once. Open one link for each Telegram account you want to activate.
                            </p>

                            <div className={styles.activationList}>
                                {activations.map((item, idx) => (
                                    <div key={idx} className={styles.activationItem}>
                                        <div className={styles.activationItemInfo}>
                                            <span className={styles.productBadge}>
                                                Activation #{idx + 1}
                                            </span>
                                            <h4 className={styles.activationItemName}>
                                                {item.productName}
                                            </h4>
                                        </div>

                                        <div className={styles.activationActions}>
                                            <a
                                                href={item.activationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.activateBtn}
                                                id={`activate-btn-${idx}`}
                                            >
                                                🔗 Activate Telegram Bot
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(item.activationUrl, idx)}
                                                className={styles.copyBtn}
                                                id={`copy-btn-${idx}`}
                                            >
                                                {copiedIndex === idx ? '✓ Copied' : '📋 Copy Link'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.supportBox}>
                        <p style={{ margin: 0 }}>
                            💬 Need help? WhatsApp{' '}
                            <a
                                href="https://wa.me/919633499974"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.supportLink}
                            >
                                9633499974
                            </a>{' '}
                            for instant reply.
                        </p>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <button
                            onClick={() => router.push('/shop')}
                            className={styles.continueBtn}
                            id="continue-shopping-btn"
                        >
                            Continue Shopping
                        </button>
                    </div>
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
                            <div
                                className={styles.errorMessage}
                                style={{
                                    color: '#ff4b4b',
                                    marginBottom: '15px',
                                    padding: '12px',
                                    background: 'rgba(255, 75, 75, 0.12)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 75, 75, 0.25)',
                                }}
                            >
                                ⚠️ {error}
                            </div>
                        )}

                        <div className={styles.totalRow}>
                            <span>Total to Pay:</span>
                            <div style={{ textAlign: 'right' }}>
                                <span>${total.toFixed(2)}</span>
                                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                                    (approx. ₹{(total * exchangeRate).toFixed(2)})
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className={styles.payBtn}>
                            {loading ? 'Processing...' : `Pay Now $${total.toFixed(2)}`}
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

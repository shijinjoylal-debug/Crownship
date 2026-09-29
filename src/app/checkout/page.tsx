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
    const [telegramLink, setTelegramLink] = useState('');
    const [telegramLinks, setTelegramLinks] = useState<Array<{
        token: string;
        itemId?: string;
        itemName: string;
        licenseIndex: number;
        totalQuantity: number;
        link: string;
    }>>([]);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

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

    const handleCopy = (token: string, link: string) => {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(link);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2500);
        }
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
                        id: i.id,
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
                                if (verifyData.telegramLink) {
                                    setTelegramLink(verifyData.telegramLink);
                                }
                                if (verifyData.telegramLinks && Array.isArray(verifyData.telegramLinks)) {
                                    setTelegramLinks(verifyData.telegramLinks);
                                }
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
        // Group licenses by item name for display
        const groupedLinks: { [itemName: string]: typeof telegramLinks } = {};
        if (telegramLinks.length > 0) {
            telegramLinks.forEach(linkObj => {
                if (!groupedLinks[linkObj.itemName]) {
                    groupedLinks[linkObj.itemName] = [];
                }
                groupedLinks[linkObj.itemName].push(linkObj);
            });
        }

        return (
            <div className={styles.successState}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                    <div className={styles.checkIcon}>✓</div>
                    <h1>Payment Successful</h1>
                    <p style={{ color: '#aaa', fontSize: '1.05rem', marginBottom: '30px' }}>
                        Your payment has been successfully verified. Your tool licenses are ready below:
                    </p>

                    {telegramLinks.length > 0 ? (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                            borderRadius: '16px',
                            padding: '30px',
                            marginBottom: '35px',
                            textAlign: 'left'
                        }}>
                            <h3 style={{ fontSize: '1.4rem', color: '#FFD700', marginBottom: '8px' }}>
                                🚀 Activate Your Tool Licenses
                            </h3>
                            <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '25px' }}>
                                Each item in your order includes an instant Telegram deep link activation. Click below to connect your Telegram account or copy the link to share with your team.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {Object.entries(groupedLinks).map(([productName, links]) => (
                                    <div key={productName} style={{
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px',
                                        padding: '20px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '16px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                            paddingBottom: '12px'
                                        }}>
                                            <h4 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>
                                                🤖 {productName}
                                            </h4>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                background: 'rgba(255, 215, 0, 0.15)',
                                                color: '#FFD700',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontWeight: 600
                                            }}>
                                                {links.length} {links.length === 1 ? 'License' : 'Licenses'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            {links.map((linkItem) => (
                                                <div key={linkItem.token} style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '12px',
                                                    background: 'rgba(255, 255, 255, 0.02)',
                                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                                    borderRadius: '8px',
                                                    padding: '12px 16px'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#eee', fontSize: '0.95rem' }}>
                                                            License #{linkItem.licenseIndex} of {linkItem.totalQuantity}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '2px' }}>
                                                            Token: {linkItem.token.slice(0, 10)}...{linkItem.token.slice(-6)}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <a
                                                            href={linkItem.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-primary"
                                                            style={{
                                                                padding: '8px 16px',
                                                                fontSize: '0.9rem',
                                                                textDecoration: 'none',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            🔗 Connect Telegram
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(linkItem.token, linkItem.link)}
                                                            style={{
                                                                background: copiedToken === linkItem.token ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                                                                color: '#fff',
                                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                                borderRadius: '6px',
                                                                padding: '8px 14px',
                                                                fontSize: '0.85rem',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            {copiedToken === linkItem.token ? '✓ Copied' : '📋 Copy Link'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p style={{
                                marginTop: '20px',
                                fontSize: '0.85rem',
                                color: '#888',
                                textAlign: 'center'
                            }}>
                                💡 Tip: Click <strong>Connect Telegram</strong> and press <strong>Start</strong> in Telegram to instantly complete activation.
                            </p>
                        </div>
                    ) : telegramLink ? (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                            borderRadius: '16px',
                            padding: '30px',
                            marginBottom: '35px'
                        }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#FFD700', marginBottom: '10px' }}>
                                Activate Your Telegram Bot
                            </h3>
                            <p style={{ color: '#aaa', marginBottom: '20px' }}>
                                Connect your Telegram account to activate your purchase automatically.
                            </p>
                            <a
                                href={telegramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{ display: 'inline-block', padding: '12px 24px' }}
                            >
                                🔗 Connect Telegram
                            </a>
                            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: '#888' }}>
                                Press <strong>Start</strong> in Telegram to complete activation.
                            </p>
                        </div>
                    ) : null}

                    <button onClick={() => router.push('/shop')} className="btn-primary" style={{ marginTop: '10px' }}>
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

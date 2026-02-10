"use client";
import { useState } from 'react';

export default function PaymentTestPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleTestPayment = async () => {
        setLoading(true);
        setStatus('idle');
        setErrorMsg('');

        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: 5,
                    currency: 'inr',
                    order_description: 'Test Transaction: 5 INR',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Payment creation failed');
            }

            if (data.invoice_url) {
                window.location.href = data.invoice_url;
            } else {
                throw new Error('No invoice URL returned');
            }

        } catch (error: any) {
            console.error('Test failed:', error);
            setStatus('error');
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{ marginBottom: '20px' }}>Payment Gateway Test Tool</h1>

            <div style={{
                border: '1px solid #ddd',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <p style={{ fontSize: '18px', marginBottom: '30px' }}>
                    Click below to initiate a test transaction of <strong>5 INR</strong>.
                </p>

                <button
                    onClick={handleTestPayment}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: loading ? '#ccc' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {loading ? 'Processing...' : 'Pay 5 INR'}
                </button>

                {status === 'error' && (
                    <div style={{ marginTop: '20px', color: '#d00', padding: '10px', background: '#fff0f0', borderRadius: '4px' }}>
                        <strong>Error:</strong> {errorMsg}
                    </div>
                )}

                <p style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
                    This will redirect you to NOWPayments to complete the crypto payment equivalent to 5 INR.
                </p>
            </div>
        </div>
    );
}

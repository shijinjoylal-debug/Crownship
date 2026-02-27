"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error((await res.json()).error);

            await refreshAuth();
            router.push('/shop');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={`glass-panel ${styles.container}`}>
                <h1>Welcome Back</h1>
                <p className={styles.subtitle}>Access your trading arsenal.</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input name="email" type="email" required placeholder="trader@example.com" />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Password</label>
                        <input name="password" type="password" required placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>

                <p className={styles.footer}>
                    New to Crownship? <Link href="/register">Create Account</Link>
                </p>
            </div>
        </div>
    );
}

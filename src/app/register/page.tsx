"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
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
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error((await res.json()).error);

            await refreshAuth();
            router.push('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={`glass-panel ${styles.container}`}>
                <h1>Join the Elite</h1>
                <p className={styles.subtitle}>Start your journey to dominance.</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Full Name</label>
                        <input name="name" type="text" required placeholder="John Doe" />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input name="email" type="email" required placeholder="trader@example.com" />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Password</label>
                        <input name="password" type="password" required placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already a member? <Link href="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

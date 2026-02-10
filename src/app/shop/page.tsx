"use client";

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';
import router, { useRouter } from 'next/router';


export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/products')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch products');
                return res.json();
            })
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please try again later.');
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Premium Trading Tools</h1>
                    <p className={styles.subtitle}>Equip yourself with the same technology used by institutional traders.</p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={() => router.push('/payment-test')}> Test Payment</button>
                </div>
            </header>

            <div className="container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading tools...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</div>
                ) : (
                    <div className="grid-products">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

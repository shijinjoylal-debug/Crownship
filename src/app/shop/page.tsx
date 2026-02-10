"use client";
import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="container" style={{ paddingTop: '40px' }}>Loading tools...</div>;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Premium Trading Tools</h1>
                    <p className={styles.subtitle}>Equip yourself with the same technology used by institutional traders.</p>
                </div>
                <div> <button onClick={() => window.location.href = '/payment-test'}>Test Payment</button></div>
            </header>

            <div className="container">
                <div className="grid-products">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}

"use client";
import Link from 'next/link';
import { Product } from '@/lib/types';
import styles from './ProductCard.module.css';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
    const { addToCart } = useCart();

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                {/* Placeholder for actual image or use a stylized gradient div if image fails/is missing */}
                <div className={styles.imagePlaceholder} style={{ backgroundImage: `url(${product.image})` }} />
                <div className={styles.category}>{product.category}</div>
            </div>
            <div className={styles.content}>
                <div className={styles.rating}>
                    <span className={styles.stars}>★★★★★</span>
                    <span className={styles.reviews}>(12k+)</span>
                </div>
                <h3 className={styles.name}>{product.name}</h3>
                <p className={styles.description}>{product.description}</p>
                
                <div className={styles.stockIndicator}>
                    <span className={styles.pulseDot}></span>
                    High Demand: Only 2 left
                </div>
                <div className={styles.footer}>
                    <span className={styles.price}>${product.price}</span>
                    <div className={styles.actions}>
                        <Link href={`/product/${product.id}`} className={styles.detailsBtn}>
                            View
                        </Link>
                        <button onClick={() => addToCart(product)} className="btn-primary">
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

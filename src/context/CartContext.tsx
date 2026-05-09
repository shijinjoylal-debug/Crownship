"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { Toaster, toast } from 'react-hot-toast';

type CartItem = Product & { quantity: number };

type CartContextType = {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    total: number;
    cartCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('cart');
        if (saved) {
            setItems(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, mounted]);

    const addToCart = (product: Product) => {
        const existing = items.find(i => i.id === product.id);
        const newQuantity = existing ? existing.quantity + 1 : 1;

        toast.success(
            <div>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '4px' }}>
                    Added to cart! (Qty: {newQuantity} • ${product.price.toFixed(2)})
                </div>
            </div>,
            {
                position: 'bottom-right',
                duration: 3000,
                style: {
                    background: 'rgba(20, 20, 20, 0.95)',
                    color: '#fff',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                },
                iconTheme: {
                    primary: '#FFD700',
                    secondary: '#1A1A1A',
                },
            }
        );

        setItems(prev => {
            const currentExisting = prev.find(i => i.id === product.id);
            if (currentExisting) {
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, cartCount }}>
            <Toaster />
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};

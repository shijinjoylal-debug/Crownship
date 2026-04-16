export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    features: string[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
}

export interface CartItem {
    name: string;
    price: number;
    quantity: number;
}

export interface PurchasedUser {
    id: string;
    name: string;
    email: string;
    items: CartItem[];
    totalAmount: number;
    status?: 'pending' | 'confirmed' | 'failed';
}

export interface ApprovedUser {
    id: string;
    email: string;
}



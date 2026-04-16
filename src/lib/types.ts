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

export interface PurchasedUser {
    id: string;
    name: string;
    email: string;
    status?: 'pending' | 'confirmed';
}



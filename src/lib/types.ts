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

export interface ItemTelegramToken {
    token: string;
    telegramId?: number | null;
    telegramUsername?: string | null;
    telegramConnected: boolean;
    connectedAt?: Date | string | null;
}

export interface CartItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    telegramTokens?: ItemTelegramToken[];
}

export interface TelegramActivation {
    token: string;
    itemId?: string;
    itemName: string;
    licenseIndex: number;
    totalQuantity: number;
    telegramId?: number | null;
    telegramUsername?: string | null;
    telegramConnected: boolean;
    connectedAt?: Date | string | null;
    link?: string;
}

export interface PurchasedUser {
    id: string;
    name: string;
    email: string;
    items: CartItem[];
    totalAmount: number;
    status?: 'pending' | 'confirmed' | 'failed';

    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;

    telegramToken?: string;
    telegramId?: number | null;
    telegramConnected?: boolean;
    telegramTokens?: TelegramActivation[];
}

export interface ApprovedUser {
    id: string;
    email: string;
}




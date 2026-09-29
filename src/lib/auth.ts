import jwt from 'jsonwebtoken';
import { User } from './types';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('WARNING: JWT_SECRET is not set in environment variables');
        }
        return 'default-fallback-secret-crownship-auth';
    }
    return secret;
}

export function signToken(user: User) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name
        },
        getJwtSecret(),
        {
            expiresIn: '30d'
        }
    );
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch (e) {
        return null;
    }
}
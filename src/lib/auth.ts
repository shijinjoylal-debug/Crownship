import jwt from 'jsonwebtoken';
import { User } from './types';

const SECRET = process.env.JWT_SECRET || 'secret';

export function signToken(user: User) {
    return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, SECRET);
    } catch (e) {
        return null;
    }
}

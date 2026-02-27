import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const existing = await db.users.findByEmail(email);
        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await db.users.create({
            id: crypto.randomUUID(),
            name,
            email,
            passwordHash
        });

        const token = signToken(newUser);
        const cookie = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
            sameSite: 'strict',
        });

        const response = NextResponse.json({ message: 'User created', user: { id: newUser.id, name: newUser.name, email: newUser.email } }, { status: 201 });
        response.headers.set('Set-Cookie', cookie);
        return response;
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

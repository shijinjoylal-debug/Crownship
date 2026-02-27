import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const cookie = serialize('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: -1,
        path: '/',
        sameSite: 'strict',
    });

    const response = NextResponse.json({ message: 'Logged out' });
    response.headers.set('Set-Cookie', cookie);
    return response;
}

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const decoded = verifyToken(token) as any;
        if (!decoded) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: decoded.id,
                name: decoded.name,
                email: decoded.email,
            }
        });
    } catch (error) {
        console.error('Auth verification error:', error);
        return NextResponse.json({ user: null });
    }
}

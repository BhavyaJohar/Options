import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

type ErrorResponse = { error: string };

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    const user = await login(username, password);
    return NextResponse.json({ id: user.id, username: user.username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid username or password';
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 401 });
  }
}
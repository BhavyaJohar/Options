import { NextResponse } from 'next/server';
import { signup } from '@/lib/auth';

type ErrorResponse = { error: string };

/**
 * POST /api/auth/signup
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
    // Validate password strength: at least 8 chars, one number, one special character
    const pwd = password as string;
    const pwdRegex = /^(?=.*\d)(?=.*\W).{8,}$/;
    if (!pwdRegex.test(pwd)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Password must be at least 8 characters long and include at least one number and one special character.' },
        { status: 400 }
      );
    }
    const user = await signup(username, password);
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
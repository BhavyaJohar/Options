import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type ErrorResponse = { error: string };

/**
 * GET /api/user/portfolios?user_id=123
 * Returns list of distinct portfolio names for a user
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Missing user_id in query parameters' },
      { status: 400 }
    );
  }
  try {
    const result = await query(
      'SELECT DISTINCT portfolio_name FROM portfolios WHERE user_id = $1 AND portfolio_name <> $2',
      [userId, '']
    );
    const names = result.rows.map((row) => row.portfolio_name);
    return NextResponse.json({ portfolios: names });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
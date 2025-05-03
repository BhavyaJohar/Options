import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type ErrorResponse = { error: string };

/**
 * GET /api/user/portfolio?user_id=123
 * Returns saved portfolios for a user
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
    const portfolioName = url.searchParams.get('portfolio_name');
    // Build query with optional filtering by portfolio_name
    let sql = 'SELECT id, symbol, quantity, cost_basis, purchased_at, portfolio_name FROM portfolios WHERE user_id = $1';
    const params: (string|number)[] = [userId];
    if (portfolioName) {
      params.push(portfolioName);
      sql += ' AND portfolio_name = $2';
    }
    sql += ' ORDER BY purchased_at';
    const result = await query(sql, params);
    return NextResponse.json({ positions: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/user/portfolio
 * Body: { user_id, symbol, quantity, cost_basis?, purchased_at? }
 */
export async function POST(request: Request) {
  try {
    const { user_id, symbol, quantity, cost_basis, purchased_at, portfolio_name } = await request.json();
    if (!user_id || !symbol || quantity === undefined || !portfolio_name) {
      return NextResponse.json<ErrorResponse>(
        { error: 'user_id, symbol, quantity, and portfolio_name are required' },
        { status: 400 }
      );
    }
    await query(
      'INSERT INTO portfolios (user_id, symbol, quantity, cost_basis, purchased_at, portfolio_name) VALUES ($1, $2, $3, $4, $5, $6)',
      [user_id, symbol, quantity, cost_basis, purchased_at, portfolio_name]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
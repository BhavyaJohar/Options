import bcrypt from 'bcryptjs';
import { query } from './db';

/**
 * Create a new user with hashed password
 */
export async function signup(
  username: string,
  password: string
): Promise<{ id: number; username: string }> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const result = await query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, hash]
  );
  return result.rows[0];
}

/**
 * Verify user credentials and return user info
 */
export async function login(
  username: string,
  password: string
): Promise<{ id: number; username: string }> {
  const result = await query(
    'SELECT id, password_hash FROM users WHERE username = $1',
    [username]
  );
  if (result.rows.length === 0) {
    throw new Error('Invalid username or password');
  }
  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }
  return { id: user.id, username };
}
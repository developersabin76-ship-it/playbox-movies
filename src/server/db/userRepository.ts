import { db } from './schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'editor' | 'moderator' | 'user';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export class UserRepository {
  static findById(id: string): UserRecord | null {
    const row = db.prepare(`
      SELECT id, email, username, role, status, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(id) as any;
    return row || null;
  }

  static findByEmail(email: string): (UserRecord & { password_hash: string }) | null {
    const row = db.prepare(`
      SELECT * FROM users WHERE LOWER(email) = LOWER(?)
    `).get(email) as any;
    return row || null;
  }

  static findByUsername(username: string): (UserRecord & { password_hash: string }) | null {
    const row = db.prepare(`
      SELECT * FROM users WHERE LOWER(username) = LOWER(?)
    `).get(username) as any;
    return row || null;
  }

  static createUser(params: {
    email: string;
    username: string;
    password: string;
    role?: 'admin' | 'editor' | 'moderator' | 'user';
  }): UserRecord {
    const id = `usr_${uuidv4()}`;
    const passwordHash = bcrypt.hashSync(params.password, 10);
    const role = params.role || 'user';

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(id, params.email.toLowerCase().trim(), params.username.trim(), passwordHash, role);

    return this.findById(id)!;
  }

  static updateLastLogin(userId: string) {
    db.prepare(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(userId);
  }

  static updatePassword(userId: string, newPassword: string): boolean {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const res = db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(passwordHash, userId);
    return res.changes > 0;
  }

  static updateUserRole(userId: string, role: 'admin' | 'editor' | 'moderator' | 'user'): boolean {
    const res = db.prepare(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(role, userId);
    return res.changes > 0;
  }

  static listUsers(limit: number = 50, offset: number = 0): UserRecord[] {
    return db.prepare(`
      SELECT id, email, username, role, status, created_at, updated_at, last_login_at
      FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset) as UserRecord[];
  }
}

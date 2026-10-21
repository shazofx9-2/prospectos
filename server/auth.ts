import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DB } from './db.js';
import { ensureUserSeeded } from './seed.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prospectos-secret-key-elite-crm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string, req?: Request) {
  if (!token) return null;

  // Handle Firebase tokens (prefixed with fb_)
  if (token.startsWith('fb_')) {
    const uid = token.replace('fb_', '');
    const users = DB.query('users');
    const existing = users.find((u) => u.id === uid || u.id === token);

    let headerName: string | undefined;
    if (req?.headers?.['x-user-name']) {
      try {
        headerName = decodeURIComponent(String(req.headers['x-user-name']));
      } catch {}
    }
    let headerEmail: string | undefined;
    if (req?.headers?.['x-user-email']) {
      try {
        headerEmail = decodeURIComponent(String(req.headers['x-user-email']));
      } catch {}
    }

    const email = existing?.email || headerEmail || `${uid}@user.com`;
    let resolvedName = headerName || existing?.name;
    if (!resolvedName || resolvedName === 'Workspace Principal' || resolvedName === 'Demo Principal') {
      resolvedName = email ? email.split('@')[0] : 'User';
    }

    if (!existing) {
      DB.insert('users', {
        id: uid,
        email,
        name: resolvedName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (headerName && headerName !== 'Workspace Principal' && headerName !== 'Demo Principal' && existing.name !== headerName) {
      DB.update('users', existing.id, { name: headerName, updatedAt: new Date().toISOString() });
    }

    return {
      id: uid,
      email,
      name: resolvedName,
    };
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token, req);

  if (!decoded) {
    return res.status(401).json({ error: 'Token is expired or invalid' });
  }

  req.user = decoded as { id: string; email: string; name: string };
  if (req.user?.id) {
    ensureUserSeeded(req.user.id);
  }
  next();
}

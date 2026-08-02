import { Router, Response } from 'express';
import { DB, User } from '../db.js';
import { hashPassword, comparePassword, generateToken, authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing email, password, or name' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const users = DB.query('users');
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DB.insert('users', newUser);

    // Generate token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        theme: newUser.theme || 'dark',
        currency: newUser.currency || 'USD',
      },
    });
  } catch (e: any) {
    console.error('Registration error:', e);
    res.status(500).json({ error: e.message || 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const users = DB.query('users');
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        theme: user.theme || 'dark',
        currency: user.currency || 'USD',
      },
    });
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message || 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const users = DB.query('users');
  const user = users.find((u) => u.id === req.user?.id);
  if (user) {
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        theme: user.theme || 'dark',
        currency: user.currency || 'USD',
      },
    });
  } else {
    res.json({ user: req.user });
  }
});

export default router;

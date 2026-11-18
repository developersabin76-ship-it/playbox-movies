import { Router, Request, Response } from 'express';
import { UserRepository } from '../db/userRepository';
import { AuditRepository } from '../db/auditRepository';
import { generateToken, loginRateLimiter, AuthenticatedRequest, requireAuth } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation Error', details: parseResult.error.flatten() });
    }

    const { email, username, password } = parseResult.data;

    // Check existing
    if (UserRepository.findByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (UserRepository.findByUsername(username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = UserRepository.createUser({ email, username, password });
    const token = generateToken(user);

    AuditRepository.logAction({
      userId: user.id,
      username: user.username,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      token
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Failed to create account', message: 'Internal server error' });
  }
});

// POST /api/auth/login
authRouter.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation Error', details: parseResult.error.flatten() });
    }

    const { emailOrUsername, password } = parseResult.data;

    const userWithHash = emailOrUsername.includes('@')
      ? UserRepository.findByEmail(emailOrUsername)
      : UserRepository.findByUsername(emailOrUsername);

    if (!userWithHash) {
      AuditRepository.logSecurityEvent({
        eventType: 'failed_login_unknown_user',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        details: `Failed login attempt for identifier: ${emailOrUsername}`,
        severity: 'warning'
      });
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    if (userWithHash.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact administration.' });
    }

    const isMatch = bcrypt.compareSync(password, userWithHash.password_hash);
    if (!isMatch) {
      AuditRepository.logSecurityEvent({
        eventType: 'failed_login_wrong_password',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        details: `Wrong password for user ID: ${userWithHash.id} (${userWithHash.username})`,
        severity: 'warning'
      });
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Success
    UserRepository.updateLastLogin(userWithHash.id);
    const token = generateToken(userWithHash);

    AuditRepository.logAction({
      userId: userWithHash.id,
      username: userWithHash.username,
      action: 'USER_LOGIN_SUCCESS',
      entityType: 'user',
      entityId: userWithHash.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string
    });

    res.json({
      message: 'Login successful',
      user: {
        id: userWithHash.id,
        email: userWithHash.email,
        username: userWithHash.username,
        role: userWithHash.role
      },
      token
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Login failed', message: 'Internal server error' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userWithHash = UserRepository.findByEmail(req.user!.email);
    if (!userWithHash || !bcrypt.compareSync(oldPassword, userWithHash.password_hash)) {
      return res.status(400).json({ error: 'Current password incorrect' });
    }

    UserRepository.updatePassword(req.user!.id, newPassword);

    AuditRepository.logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'user',
      entityId: req.user!.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

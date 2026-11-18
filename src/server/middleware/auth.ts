import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository, UserRecord } from '../db/userRepository';
import { AuditRepository } from '../db/auditRepository';
import rateLimit from 'express-rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'lionel-agasobanuye-super-secure-production-key-2026-rwanda';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function generateToken(user: UserRecord): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = UserRepository.findById(decoded.id);
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch (err) {
    // Invalid/expired token - continue as unauthenticated
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  next();
}

export function requireRole(allowedRoles: Array<'admin' | 'editor' | 'moderator' | 'user'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      AuditRepository.logSecurityEvent({
        eventType: 'unauthorized_access_attempt',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        details: `Access denied to ${req.originalUrl} - No token provided`,
        severity: 'warning'
      });
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      AuditRepository.logSecurityEvent({
        eventType: 'insufficient_role_permission',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        details: `User ${req.user.username} (${req.user.role}) attempted to access protected endpoint: ${req.originalUrl}`,
        severity: 'warning'
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireEditor = requireRole(['admin', 'editor']);
export const requireModerator = requireRole(['admin', 'editor', 'moderator']);

// RATE LIMITERS
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // max 10 failed logins
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    trustProxy: false
  },
  handler: (req, res, next, options) => {
    AuditRepository.logSecurityEvent({
      eventType: 'login_rate_limit_exceeded',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
      details: `Rate limit triggered for IP ${req.ip}`,
      severity: 'critical'
    });
    res.status(429).json(options.message);
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 180, // 180 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    trustProxy: false
  }
});

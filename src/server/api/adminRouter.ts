import { Router, Request, Response } from 'express';
import { db } from '../db/schema';
import { UserRepository } from '../db/userRepository';
import { AuditRepository } from '../db/auditRepository';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

export const adminRouter = Router();

// GET /api/admin/metrics
adminRouter.get('/metrics', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const moviesCount = (db.prepare(`SELECT COUNT(*) as count FROM movies WHERE is_deleted = 0`).get() as any)?.count || 0;
    const tvShowsCount = (db.prepare(`SELECT COUNT(*) as count FROM tv_shows WHERE is_deleted = 0`).get() as any)?.count || 0;
    const usersCount = (db.prepare(`SELECT COUNT(*) as count FROM users`).get() as any)?.count || 0;
    const videoSourcesCount = (db.prepare(`SELECT COUNT(*) as count FROM video_sources WHERE status = 'active'`).get() as any)?.count || 0;
    const moviesWithVideo = (db.prepare(`
      SELECT COUNT(DISTINCT movie_id) as count FROM video_sources WHERE movie_id IS NOT NULL AND status = 'active'
    `).get() as any)?.count || 0;
    const securityEventsCount = (db.prepare(`SELECT COUNT(*) as count FROM security_events`).get() as any)?.count || 0;

    res.json({
      moviesCount,
      tvShowsCount,
      usersCount,
      videoSourcesCount,
      moviesWithVideo,
      moviesWithoutVideo: moviesCount - moviesWithVideo,
      securityEventsCount,
      databaseType: 'SQLite3 WAL Relational Database Engine',
      storageLocation: 'data/production_streaming.db'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute admin metrics' });
  }
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const logs = AuditRepository.getRecentAuditLogs(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// GET /api/admin/security-events
adminRouter.get('/security-events', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const events = AuditRepository.getRecentSecurityEvents(limit);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security events' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = UserRepository.listUsers(100, 0);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// POST /api/admin/users/:id/role
adminRouter.post('/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    UserRepository.updateUserRole(id, role);

    AuditRepository.logAction({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'CHANGE_USER_ROLE',
      entityType: 'user',
      entityId: id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
      metadata: { targetUserId: id, newRole: role }
    });

    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/backup - Database snapshot export
adminRouter.get('/backup/export', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const movies = db.prepare(`SELECT * FROM movies WHERE is_deleted = 0`).all();
    const videoSources = db.prepare(`SELECT * FROM video_sources`).all();
    const genres = db.prepare(`SELECT * FROM genres`).all();
    const movieGenres = db.prepare(`SELECT * FROM movie_genres`).all();
    const settings = db.prepare(`SELECT * FROM system_settings`).all();

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: req.user?.username,
      database: {
        movies,
        videoSources,
        genres,
        movieGenres,
        settings
      }
    };

    AuditRepository.logAction({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'DATABASE_BACKUP_EXPORTED',
      entityType: 'database',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lionel_stream_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate database backup' });
  }
});

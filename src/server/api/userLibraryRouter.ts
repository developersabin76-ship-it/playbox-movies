import { Router, Response } from 'express';
import { db } from '../db/schema';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const userLibraryRouter = Router();

// ==========================================
// 1. FAVORITES
// ==========================================
userLibraryRouter.get('/favorites', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const favorites = db.prepare(`
      SELECT f.id, f.movie_id, f.tv_show_id, f.created_at,
             m.title, m.poster_url, m.rating, m.year, m.quality, m.director
      FROM favorites f
      LEFT JOIN movies m ON m.id = f.movie_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

userLibraryRouter.post('/favorites/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { movieId, tvShowId } = req.body;

    const existing = db.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND (movie_id = ? OR tv_show_id = ?)
    `).get(userId, movieId || null, tvShowId || null) as any;

    if (existing) {
      db.prepare(`DELETE FROM favorites WHERE id = ?`).run(existing.id);
      return res.json({ favorited: false, message: 'Removed from favorites' });
    } else {
      const id = `fav_${uuidv4()}`;
      db.prepare(`
        INSERT INTO favorites (id, user_id, movie_id, tv_show_id)
        VALUES (?, ?, ?, ?)
      `).run(id, userId, movieId || null, tvShowId || null);
      return res.json({ favorited: true, message: 'Added to favorites' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// ==========================================
// 2. WATCH HISTORY & CONTINUE WATCHING
// ==========================================
userLibraryRouter.get('/continue-watching', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = db.prepare(`
      SELECT cw.id, cw.movie_id, cw.episode_id, cw.progress_seconds, cw.duration_seconds, cw.updated_at,
             m.title, m.poster_url, m.backdrop_url, m.duration, m.director
      FROM continue_watching cw
      LEFT JOIN movies m ON m.id = cw.movie_id
      WHERE cw.user_id = ?
      ORDER BY cw.updated_at DESC
      LIMIT 20
    `).all(userId);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch continue watching list' });
  }
});

userLibraryRouter.post('/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { movieId, episodeId, progressSeconds, durationSeconds } = req.body;

    if (!movieId && !episodeId) {
      return res.status(400).json({ error: 'movieId or episodeId required' });
    }

    const id = `cw_${uuidv4()}`;
    const progress = Math.max(0, parseInt(progressSeconds, 10) || 0);
    const duration = Math.max(0, parseInt(durationSeconds, 10) || 0);
    const isCompleted = duration > 0 && progress >= duration * 0.9 ? 1 : 0;

    // Upsert continue watching
    db.prepare(`
      INSERT INTO continue_watching (id, user_id, movie_id, episode_id, progress_seconds, duration_seconds, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, movie_id, episode_id) DO UPDATE SET
        progress_seconds = excluded.progress_seconds,
        duration_seconds = excluded.duration_seconds,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, userId, movieId || null, episodeId || null, progress, duration);

    // Upsert watch history
    db.prepare(`
      INSERT INTO watch_history (id, user_id, movie_id, episode_id, progress_seconds, duration_seconds, completed, last_watched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, movie_id, episode_id) DO UPDATE SET
        progress_seconds = excluded.progress_seconds,
        duration_seconds = excluded.duration_seconds,
        completed = excluded.completed,
        last_watched_at = CURRENT_TIMESTAMP
    `).run(`wh_${uuidv4()}`, userId, movieId || null, episodeId || null, progress, duration, isCompleted);

    res.json({ success: true, progress, isCompleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record playback progress' });
  }
});

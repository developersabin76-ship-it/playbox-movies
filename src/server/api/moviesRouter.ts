import { Router, Request, Response } from 'express';
import { MovieRepository } from '../db/movieRepository';
import { AuditRepository } from '../db/auditRepository';
import { AuthenticatedRequest, requireEditor, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

export const moviesRouter = Router();

// GET /api/movies - List movies with pagination and filters
moviesRouter.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 24;
    const search = (req.query.search as string) || undefined;
    const genre = (req.query.genre as string) || undefined;
    const access = (req.query.access as string) || undefined;
    const director = (req.query.director as string) || undefined;
    const featured = req.query.featured === 'true' ? true : undefined;
    const popular = req.query.popular === 'true' ? true : undefined;
    const hasVideo = req.query.hasVideo === 'true' ? true : req.query.hasVideo === 'false' ? false : undefined;

    const result = MovieRepository.listMovies({
      page,
      limit,
      search,
      genre,
      access,
      director,
      featured,
      popular,
      hasVideo
    });

    res.json(result);
  } catch (err: any) {
    console.error('[Movies API List Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve movies' });
  }
});

// GET /api/movies/:id - Get movie details and playable stream
moviesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let movie = MovieRepository.getMovieById(id);
    if (!movie) {
      movie = MovieRepository.getMovieBySlug(id);
    }
    if (!movie && !isNaN(Number(id))) {
      movie = MovieRepository.getMovieByTmdbId(Number(id));
    }

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(movie);
  } catch (err: any) {
    console.error('[Movies API Detail Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve movie details' });
  }
});

// POST /api/movies - Create or update movie (Editor / Admin only)
const movieInputSchema = z.object({
  id: z.string().optional(),
  tmdb_id: z.number().optional().nullable(),
  imdb_id: z.string().optional().nullable(),
  slug: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  original_title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  poster_url: z.string().url().optional().nullable(),
  backdrop_url: z.string().url().optional().nullable(),
  trailer_url: z.string().url().optional().nullable(),
  release_date: z.string().optional().nullable(),
  year: z.number().optional().nullable(),
  runtime: z.number().optional().nullable(),
  duration: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  director: z.string().optional().nullable(),
  rating: z.number().min(0).max(10).optional().nullable(),
  age_rating: z.string().optional().nullable(),
  quality: z.string().optional().nullable(),
  access: z.enum(['FREE', 'PREMIUM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  popular: z.boolean().optional(),
  download_enabled: z.boolean().optional(),
  genres: z.array(z.string()).optional(),
  video_sources: z.array(z.object({
    id: z.string().optional(),
    source_type: z.enum(['mp4', 'hls', 'dash', 'embed', 'm3u8']).default('mp4'),
    video_url: z.string().url('Valid video URL required'),
    quality: z.string().optional(),
    language: z.string().optional(),
    audio_language: z.string().optional(),
    subtitle_url: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    status: z.enum(['active', 'inactive', 'broken']).default('active'),
    is_primary: z.number().optional()
  })).optional()
});

moviesRouter.post('/', requireEditor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = movieInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation Error', details: parseResult.error.flatten() });
    }

    const data = parseResult.data;
    const movie = MovieRepository.saveMovie(
      {
        ...data,
        featured: data.featured ? 1 : 0,
        popular: data.popular ? 1 : 0,
        download_enabled: data.download_enabled !== undefined ? (data.download_enabled ? 1 : 0) : 1
      },
      data.video_sources as any
    );

    AuditRepository.logAction({
      userId: req.user?.id,
      username: req.user?.username,
      action: data.id ? 'UPDATE_MOVIE' : 'CREATE_MOVIE',
      entityType: 'movie',
      entityId: movie.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
      metadata: { title: movie.title, tmdb_id: movie.tmdb_id }
    });

    res.status(200).json({
      message: 'Movie saved successfully to database',
      movie
    });
  } catch (err: any) {
    console.error('[Movie Save API Error]:', err);
    res.status(500).json({ error: 'Failed to save movie to database' });
  }
});

// DELETE /api/movies/:id - Soft Delete movie (Admin only)
moviesRouter.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = MovieRepository.softDeleteMovie(id);
    if (!success) {
      return res.status(404).json({ error: 'Movie not found or already removed' });
    }

    AuditRepository.logAction({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'SOFT_DELETE_MOVIE',
      entityType: 'movie',
      entityId: id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string
    });

    res.json({ message: 'Movie removed successfully' });
  } catch (err: any) {
    console.error('[Movie Delete API Error]:', err);
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

import { db } from './schema';
import { v4 as uuidv4 } from 'uuid';

export interface MovieRecord {
  id: string;
  tmdb_id?: number | null;
  imdb_id?: string | null;
  slug: string;
  title: string;
  original_title?: string | null;
  description?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
  release_date?: string | null;
  year?: number | null;
  runtime?: number | null;
  duration?: string | null;
  language?: string | null;
  country?: string | null;
  director?: string | null;
  rating?: number | null;
  vote_count?: number | null;
  age_rating?: string | null;
  quality?: string | null;
  access?: 'FREE' | 'PREMIUM';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured?: number;
  popular?: number;
  download_enabled?: number;
  is_deleted?: number;
  created_at?: string;
  updated_at?: string;
  genres?: string[];
  video_sources?: any[];
}

export interface VideoSourceRecord {
  id?: string;
  movie_id?: string | null;
  episode_id?: string | null;
  source_type: 'mp4' | 'hls' | 'dash' | 'embed' | 'm3u8';
  video_url: string;
  quality?: string;
  language?: string;
  audio_language?: string;
  subtitle_url?: string | null;
  duration?: string | null;
  status?: 'active' | 'inactive' | 'broken';
  is_primary?: number;
}

export class MovieRepository {
  static getMovieById(id: string): MovieRecord | null {
    const movie = db.prepare(`SELECT * FROM movies WHERE id = ? AND is_deleted = 0`).get(id) as any;
    if (!movie) return null;
    return this.enrichMovie(movie);
  }

  static getMovieByTmdbId(tmdbId: number): MovieRecord | null {
    const movie = db.prepare(`SELECT * FROM movies WHERE tmdb_id = ? AND is_deleted = 0`).get(tmdbId) as any;
    if (!movie) return null;
    return this.enrichMovie(movie);
  }

  static getMovieBySlug(slug: string): MovieRecord | null {
    const movie = db.prepare(`SELECT * FROM movies WHERE slug = ? AND is_deleted = 0`).get(slug) as any;
    if (!movie) return null;
    return this.enrichMovie(movie);
  }

  static listMovies(options: {
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
    access?: string;
    status?: string;
    featured?: boolean;
    popular?: boolean;
    hasVideo?: boolean;
    director?: string;
  }): { movies: MovieRecord[]; total: number; page: number; totalPages: number } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 24));
    const offset = (page - 1) * limit;

    let whereClauses: string[] = ['m.is_deleted = 0'];
    const params: any[] = [];

    if (options.status) {
      whereClauses.push('m.status = ?');
      params.push(options.status);
    } else {
      whereClauses.push("m.status = 'PUBLISHED'");
    }

    if (options.search) {
      whereClauses.push('(m.title LIKE ? OR m.director LIKE ? OR m.description LIKE ?)');
      const q = `%${options.search}%`;
      params.push(q, q, q);
    }

    if (options.access) {
      whereClauses.push('m.access = ?');
      params.push(options.access);
    }

    if (options.featured !== undefined) {
      whereClauses.push('m.featured = ?');
      params.push(options.featured ? 1 : 0);
    }

    if (options.popular !== undefined) {
      whereClauses.push('m.popular = ?');
      params.push(options.popular ? 1 : 0);
    }

    if (options.director) {
      whereClauses.push('m.director = ?');
      params.push(options.director);
    }

    if (options.hasVideo !== undefined) {
      if (options.hasVideo) {
        whereClauses.push(`EXISTS (SELECT 1 FROM video_sources vs WHERE vs.movie_id = m.id AND vs.status = 'active')`);
      } else {
        whereClauses.push(`NOT EXISTS (SELECT 1 FROM video_sources vs WHERE vs.movie_id = m.id AND vs.status = 'active')`);
      }
    }

    if (options.genre) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM movie_genres mg 
        JOIN genres g ON g.id = mg.genre_id 
        WHERE mg.movie_id = m.id AND (g.slug = ? OR g.name = ?)
      )`);
      params.push(options.genre.toLowerCase(), options.genre);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM movies m WHERE ${whereSql}`).get(...params) as any;
    const total = countRow?.count || 0;

    const rows = db.prepare(`
      SELECT m.* FROM movies m
      WHERE ${whereSql}
      ORDER BY m.featured DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const movies = rows.map((r) => this.enrichMovie(r));

    return {
      movies,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  static saveMovie(movie: Partial<MovieRecord> & { title: string }, videoSources?: VideoSourceRecord[]): MovieRecord {
    const existing = movie.tmdb_id
      ? db.prepare(`SELECT * FROM movies WHERE tmdb_id = ?`).get(movie.tmdb_id) as any
      : movie.id
      ? db.prepare(`SELECT * FROM movies WHERE id = ?`).get(movie.id) as any
      : null;

    const id = existing?.id || movie.id || `mov_${uuidv4()}`;
    const slug = movie.slug || movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `movie-${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO movies (
        id, tmdb_id, imdb_id, slug, title, original_title, description,
        poster_url, backdrop_url, trailer_url, release_date, year, runtime,
        duration, language, country, director, rating, vote_count, age_rating,
        quality, access, status, featured, popular, download_enabled, is_deleted,
        updated_at
      ) VALUES (
        @id, @tmdb_id, @imdb_id, @slug, @title, @original_title, @description,
        @poster_url, @backdrop_url, @trailer_url, @release_date, @year, @runtime,
        @duration, @language, @country, @director, @rating, @vote_count, @age_rating,
        @quality, @access, @status, @featured, @popular, @download_enabled, 0,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        tmdb_id = COALESCE(excluded.tmdb_id, movies.tmdb_id),
        imdb_id = COALESCE(excluded.imdb_id, movies.imdb_id),
        slug = excluded.slug,
        title = excluded.title,
        original_title = excluded.original_title,
        description = excluded.description,
        poster_url = excluded.poster_url,
        backdrop_url = excluded.backdrop_url,
        trailer_url = excluded.trailer_url,
        release_date = excluded.release_date,
        year = excluded.year,
        runtime = excluded.runtime,
        duration = excluded.duration,
        language = excluded.language,
        country = excluded.country,
        director = excluded.director,
        rating = excluded.rating,
        vote_count = excluded.vote_count,
        age_rating = excluded.age_rating,
        quality = excluded.quality,
        access = excluded.access,
        status = excluded.status,
        featured = excluded.featured,
        popular = excluded.popular,
        download_enabled = excluded.download_enabled,
        is_deleted = 0,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({
      id,
      tmdb_id: movie.tmdb_id || null,
      imdb_id: movie.imdb_id || null,
      slug,
      title: movie.title,
      original_title: movie.original_title || null,
      description: movie.description || '',
      poster_url: movie.poster_url || null,
      backdrop_url: movie.backdrop_url || null,
      trailer_url: movie.trailer_url || null,
      release_date: movie.release_date || null,
      year: movie.year || new Date().getFullYear(),
      runtime: movie.runtime || 105,
      duration: movie.duration || '01:45:00',
      language: movie.language || 'Kinyarwanda',
      country: movie.country || 'Rwanda',
      director: movie.director || 'Junior Giti',
      rating: movie.rating || 9.0,
      vote_count: movie.vote_count || 1,
      age_rating: movie.age_rating || '16+',
      quality: movie.quality || '1080p Full HD',
      access: movie.access || 'FREE',
      status: movie.status || 'PUBLISHED',
      featured: movie.featured ? 1 : 0,
      popular: movie.popular ? 1 : 0,
      download_enabled: movie.download_enabled !== undefined ? (movie.download_enabled ? 1 : 0) : 1
    });

    // Update genres
    if (movie.genres && Array.isArray(movie.genres)) {
      this.attachGenresToMovie(id, movie.genres);
    }

    // Attach video sources if provided
    if (videoSources && Array.isArray(videoSources) && videoSources.length > 0) {
      this.saveMovieVideoSources(id, videoSources);
    }

    return this.getMovieById(id)!;
  }

  static attachGenresToMovie(movieId: string, genreNames: string[]) {
    db.prepare(`DELETE FROM movie_genres WHERE movie_id = ?`).run(movieId);
    const getGenreStmt = db.prepare(`SELECT id FROM genres WHERE name = ? OR slug = ?`);
    const insertGenreStmt = db.prepare(`INSERT INTO genres (name, slug) VALUES (?, ?)`);
    const linkStmt = db.prepare(`INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`);

    for (const name of genreNames) {
      if (!name || !name.trim()) continue;
      const cleanName = name.trim();
      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let genre = getGenreStmt.get(cleanName, slug) as any;
      if (!genre) {
        const info = insertGenreStmt.run(cleanName, slug);
        genre = { id: info.lastInsertRowid };
      }
      linkStmt.run(movieId, genre.id);
    }
  }

  static saveMovieVideoSources(movieId: string, sources: VideoSourceRecord[]) {
    db.prepare(`DELETE FROM video_sources WHERE movie_id = ?`).run(movieId);
    const insertStmt = db.prepare(`
      INSERT INTO video_sources (
        id, movie_id, source_type, video_url, quality, language,
        audio_language, subtitle_url, duration, status, is_primary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sources.forEach((src, idx) => {
      const srcId = src.id || `vs_${uuidv4()}`;
      insertStmt.run(
        srcId,
        movieId,
        src.source_type || 'mp4',
        src.video_url,
        src.quality || '1080p',
        src.language || 'Kinyarwanda',
        src.audio_language || 'Kinyarwanda',
        src.subtitle_url || null,
        src.duration || null,
        src.status || 'active',
        src.is_primary !== undefined ? (src.is_primary ? 1 : 0) : idx === 0 ? 1 : 0
      );
    });
  }

  static softDeleteMovie(id: string): boolean {
    const res = db.prepare(`UPDATE movies SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  private static enrichMovie(movie: any): MovieRecord {
    const genres = db.prepare(`
      SELECT g.name FROM genres g
      JOIN movie_genres mg ON mg.genre_id = g.id
      WHERE mg.movie_id = ?
    `).all(movie.id).map((r: any) => r.name);

    const video_sources = db.prepare(`
      SELECT * FROM video_sources WHERE movie_id = ? ORDER BY is_primary DESC, quality DESC
    `).all(movie.id);

    return {
      ...movie,
      featured: Boolean(movie.featured),
      popular: Boolean(movie.popular),
      download_enabled: Boolean(movie.download_enabled),
      genres,
      video_sources
    };
  }
}

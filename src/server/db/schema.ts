import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'production_streaming.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'moderator', 'user')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      tmdb_id INTEGER UNIQUE,
      imdb_id TEXT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      original_title TEXT,
      description TEXT,
      poster_url TEXT,
      backdrop_url TEXT,
      trailer_url TEXT,
      release_date TEXT,
      year INTEGER,
      runtime INTEGER,
      duration TEXT,
      language TEXT DEFAULT 'Kinyarwanda',
      country TEXT DEFAULT 'Rwanda',
      director TEXT DEFAULT 'Junior Giti',
      rating REAL DEFAULT 9.0,
      vote_count INTEGER DEFAULT 1,
      age_rating TEXT DEFAULT '16+',
      quality TEXT DEFAULT '1080p Full HD',
      access TEXT NOT NULL DEFAULT 'FREE' CHECK (access IN ('FREE', 'PREMIUM')),
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      featured INTEGER NOT NULL DEFAULT 0,
      popular INTEGER NOT NULL DEFAULT 0,
      download_enabled INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tv_shows (
      id TEXT PRIMARY KEY,
      tmdb_id INTEGER UNIQUE,
      imdb_id TEXT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      original_title TEXT,
      description TEXT,
      poster_url TEXT,
      backdrop_url TEXT,
      trailer_url TEXT,
      first_air_date TEXT,
      last_air_date TEXT,
      year INTEGER,
      language TEXT DEFAULT 'Kinyarwanda',
      country TEXT DEFAULT 'Rwanda',
      director TEXT DEFAULT 'Junior Giti',
      rating REAL DEFAULT 9.0,
      vote_count INTEGER DEFAULT 1,
      age_rating TEXT DEFAULT '16+',
      access TEXT NOT NULL DEFAULT 'FREE' CHECK (access IN ('FREE', 'PREMIUM')),
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      featured INTEGER NOT NULL DEFAULT 0,
      popular INTEGER NOT NULL DEFAULT 0,
      seasons_count INTEGER DEFAULT 1,
      total_episodes_count INTEGER DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      tv_show_id TEXT NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
      tmdb_season_id INTEGER,
      season_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      poster_url TEXT,
      air_date TEXT,
      episodes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tv_show_id, season_number)
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
      tv_show_id TEXT NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
      tmdb_episode_id INTEGER,
      episode_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      still_url TEXT,
      air_date TEXT,
      runtime INTEGER,
      duration TEXT DEFAULT '45:00',
      access TEXT NOT NULL DEFAULT 'FREE' CHECK (access IN ('FREE', 'PREMIUM')),
      download_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(season_id, episode_number)
    );

    CREATE TABLE IF NOT EXISTS video_sources (
      id TEXT PRIMARY KEY,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL DEFAULT 'mp4' CHECK (source_type IN ('mp4', 'hls', 'dash', 'embed', 'm3u8')),
      video_url TEXT NOT NULL,
      quality TEXT NOT NULL DEFAULT '1080p',
      language TEXT DEFAULT 'Kinyarwanda',
      audio_language TEXT DEFAULT 'Kinyarwanda',
      subtitle_url TEXT,
      duration TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'broken')),
      is_primary INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK ((movie_id IS NOT NULL AND episode_id IS NULL) OR (movie_id IS NULL AND episode_id IS NOT NULL))
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY (movie_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS tv_genres (
      tv_show_id TEXT NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY (tv_show_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS media_posters (
      id TEXT PRIMARY KEY,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      tv_show_id TEXT REFERENCES tv_shows(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      image_type TEXT NOT NULL DEFAULT 'poster' CHECK (image_type IN ('poster', 'backdrop', 'still', 'banner')),
      source TEXT DEFAULT 'tmdb',
      is_primary INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trailers (
      id TEXT PRIMARY KEY,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      tv_show_id TEXT REFERENCES tv_shows(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      provider TEXT DEFAULT 'youtube',
      type TEXT DEFAULT 'Trailer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      tv_show_id TEXT REFERENCES tv_shows(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id, tv_show_id)
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      tv_show_id TEXT REFERENCES tv_shows(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id, tv_show_id)
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
      progress_seconds INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id, episode_id)
    );

    CREATE TABLE IF NOT EXISTS continue_watching (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      episode_id TEXT REFERENCES episodes(id) ON DELETE CASCADE,
      progress_seconds INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id, episode_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      tv_show_id TEXT REFERENCES tv_shows(id) ON DELETE CASCADE,
      rating REAL DEFAULT 10.0,
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS streaming_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_url TEXT,
      website_url TEXT
    );

    CREATE TABLE IF NOT EXISTS availability (
      id TEXT PRIMARY KEY,
      movie_id TEXT REFERENCES movies(id) ON DELETE CASCADE,
      tv_show_id TEXT REFERENCES tv_shows(id) ON DELETE CASCADE,
      provider_id TEXT REFERENCES streaming_providers(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'stream',
      url TEXT,
      country TEXT DEFAULT 'RW',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- OPTIMIZED PERFORMANCE INDEXES
    CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
    CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
    CREATE INDEX IF NOT EXISTS idx_movies_status_published ON movies(status, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(featured);
    CREATE INDEX IF NOT EXISTS idx_movies_popular ON movies(popular);
    CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);

    CREATE INDEX IF NOT EXISTS idx_tv_shows_tmdb_id ON tv_shows(tmdb_id);
    CREATE INDEX IF NOT EXISTS idx_tv_shows_slug ON tv_shows(slug);
    CREATE INDEX IF NOT EXISTS idx_tv_shows_status ON tv_shows(status, is_deleted);

    CREATE INDEX IF NOT EXISTS idx_seasons_tv_show ON seasons(tv_show_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_tv_show ON episodes(tv_show_id);

    CREATE INDEX IF NOT EXISTS idx_video_sources_movie ON video_sources(movie_id);
    CREATE INDEX IF NOT EXISTS idx_video_sources_episode ON video_sources(episode_id);

    CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_continue_watching_user ON continue_watching(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(movie_id, tv_show_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON admin_audit_logs(created_at);
  `);

  // Seed default genres
  const defaultGenres = [
    { name: 'Agasobanuye', slug: 'agasobanuye' },
    { name: 'Action', slug: 'action' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'Animation', slug: 'animation' },
    { name: 'Comedy', slug: 'comedy' },
    { name: 'Crime', slug: 'crime' },
    { name: 'Drama', slug: 'drama' },
    { name: 'Fantasy', slug: 'fantasy' },
    { name: 'Horror', slug: 'horror' },
    { name: 'Mystery', slug: 'mystery' },
    { name: 'Romance', slug: 'romance' },
    { name: 'Sci-Fi', slug: 'sci-fi' },
    { name: 'Thriller', slug: 'thriller' },
    { name: 'War', slug: 'war' },
    { name: 'Martial Arts', slug: 'martial-arts' }
  ];

  const insertGenre = db.prepare(`INSERT OR IGNORE INTO genres (name, slug) VALUES (?, ?)`);
  const insertMany = db.transaction((genres) => {
    for (const g of genres) insertGenre.run(g.name, g.slug);
  });
  insertMany(defaultGenres);

  // Seed default Admin User if not exists
  const adminCheck = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
  if (!adminCheck) {
    const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_INITIAL_PASSWORD || 'LionelAdmin2026!', 10);
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run('usr_admin_master', 'developersabin76@gmail.com', 'LionelAdmin', adminPasswordHash);
    console.log('[Database] Seeded master admin user: developersabin76@gmail.com');
  }

  // Seed default system settings
  const insertSetting = db.prepare(`INSERT OR IGNORE INTO system_settings (id, setting_key, setting_value) VALUES (?, ?, ?)`);
  insertSetting.run('set_site_name', 'site_name', 'Lionel Agasobanuye Streaming');
  insertSetting.run('set_streaming_quality', 'default_quality', '1080p Full HD');
  insertSetting.run('set_allow_guest_browse', 'allow_guest_browse', 'true');
  insertSetting.run('set_max_login_attempts', 'max_login_attempts', '5');

  console.log('[Database] Relational tables, indexes, genres and security constraints initialized successfully.');
}

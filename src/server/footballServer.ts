import { Request, Response } from 'express';
import axios from 'axios';

const DEFAULT_KEY = 'af0694907fmsh7790ade41c261e2p1fa6efjsn5e57a43915b4';
const DEFAULT_HOST = 'free-api-live-football-data.p.rapidapi.com';
const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_API_KEY?.trim() || '0a8279e74c4a4d01a10a2f4ab9c0924a';

const envKey = process.env.RAPIDAPI_FOOTBALL_KEY?.trim();
const envHost = process.env.RAPIDAPI_FOOTBALL_HOST?.trim();

const RAPIDAPI_KEY = (envKey && envKey.length > 25 && !envKey.includes('@')) ? envKey : DEFAULT_KEY;
const RAPIDAPI_HOST = (envHost && envHost.includes('rapidapi.com')) ? envHost : DEFAULT_HOST;
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// In-memory cache to prevent exhausting API rate limits
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_LIVE_MS = 25 * 1000; // 25 seconds for live scores
const CACHE_TTL_MATCHES_MS = 90 * 1000; // 90 seconds for daily fixtures
const CACHE_TTL_FOOTBALL_DATA_MS = 5 * 60 * 1000; // 5 minutes for football-data.org (10 req/min limit)
const CACHE_TTL_LEAGUES_MS = 2 * 60 * 60 * 1000; // 2 hours for league lists
const CACHE_TTL_STANDINGS_MS = 10 * 60 * 1000; // 10 minutes for standings

const getHeaders = () => ({
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': RAPIDAPI_KEY,
  'accept': 'application/json',
  'x-rapidapi-ua': 'RapidAPI-Playground'
});

// Curated fallbacks for top leagues when external service is offline or rate-limited
export const FALLBACK_MATCHES = [
  {
    id: 9001,
    leagueId: 42,
    leagueName: 'UEFA Champions League',
    time: '21:00 CAT',
    status: 'LIVE',
    minute: "72'",
    home: { id: 8633, name: 'Real Madrid', score: 2, logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80' },
    away: { id: 8456, name: 'Manchester City', score: 1, logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80' },
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    commentaryLanguage: 'Kinyarwanda Direct (Radio 1 & TV10)'
  },
  {
    id: 9002,
    leagueId: 47,
    leagueName: 'Premier League',
    time: '18:30 CAT',
    status: 'LIVE',
    minute: "44'",
    home: { id: 9825, name: 'Arsenal', score: 3, logo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=120&q=80' },
    away: { id: 8455, name: 'Chelsea', score: 0, logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=120&q=80' },
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    commentaryLanguage: 'Kinyarwanda Direct (Flash FM & RBA)'
  },
  {
    id: 9003,
    leagueId: 999,
    leagueName: 'Rwanda Premier League',
    time: '15:00 CAT',
    status: 'LIVE',
    minute: "85'",
    home: { id: 7001, name: 'APR FC', score: 1, logo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=120&q=80' },
    away: { id: 7002, name: 'Rayon Sports', score: 1, logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&q=80' },
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    commentaryLanguage: 'Kinyarwanda Direct (Isango Star)'
  },
  {
    id: 9004,
    leagueId: 87,
    leagueName: 'Spanish La Liga',
    time: '22:00 CAT',
    status: 'UPCOMING',
    home: { id: 8634, name: 'Barcelona', score: 0, logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80' },
    away: { id: 9906, name: 'Atletico Madrid', score: 0, logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80' },
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    commentaryLanguage: 'Kinyarwanda & French'
  }
];

/**
 * Normalizes an API match into a clean, uniform match object
 */
function normalizeMatch(m: any, defaultLeagueName = 'Global Football League') {
  const isLive = Boolean(m.status?.started && !m.status?.finished && !m.status?.cancelled);
  const isFinished = Boolean(m.status?.finished);
  
  let matchStatus: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'UPCOMING';
  if (isLive) matchStatus = 'LIVE';
  else if (isFinished) matchStatus = 'FINISHED';

  const minuteStr = m.status?.liveTime?.short || (isLive ? "Live" : undefined);
  const homeScore = typeof m.home?.score === 'number' ? m.home.score : (isLive || isFinished ? 0 : undefined);
  const awayScore = typeof m.away?.score === 'number' ? m.away.score : (isLive || isFinished ? 0 : undefined);

  return {
    id: m.id || Math.random(),
    leagueId: m.leagueId,
    leagueName: m.leagueName || defaultLeagueName,
    time: m.time || 'Today',
    status: matchStatus,
    minute: minuteStr,
    home: {
      id: m.home?.id,
      name: m.home?.name || m.home?.longName || 'Home Team',
      score: homeScore,
      logo: m.home?.id
        ? `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png`
        : 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80'
    },
    away: {
      id: m.away?.id,
      name: m.away?.name || m.away?.longName || 'Away Team',
      score: awayScore,
      logo: m.away?.id
        ? `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png`
        : 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80'
    },
    scoreStr: m.status?.scoreStr || (homeScore !== undefined && awayScore !== undefined ? `${homeScore} - ${awayScore}` : 'VS'),
    tournamentStage: m.tournamentStage,
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    commentaryLanguage: 'Kinyarwanda (Direct Audio Feed) & English',
    serverCount: 4
  };
}

/**
 * GET /api/football/status - Health and RapidAPI configuration check
 */
export async function handleFootballStatus(_req: Request, res: Response) {
  return res.json({
    status: 'ok',
    provider: 'Free API Live Football Data (RapidAPI)',
    host: RAPIDAPI_HOST,
    hasApiKey: Boolean(RAPIDAPI_KEY),
    cachedEntries: cache.size
  });
}

/**
 * GET /api/football/live - Current ongoing live matches
 */
export async function handleFootballLive(_req: Request, res: Response) {
  const cacheKey = 'football_current_live';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_LIVE_MS) {
    return res.json(cached.data);
  }

  try {
    const apiRes = await axios.get(`${BASE_URL}/football-current-live`, {
      headers: getHeaders(),
      timeout: 9000
    });

    const rawList = apiRes.data?.response?.live || [];
    const normalized = rawList.map((m: any) => normalizeMatch(m, 'Live Championship'));

    const result = {
      status: 'success',
      totalLive: normalized.length,
      matches: normalized.length > 0 ? normalized : FALLBACK_MATCHES.filter(m => m.status === 'LIVE'),
      isFallback: normalized.length === 0,
      timestamp: Date.now()
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  } catch (err: any) {
    console.warn('[RapidAPI Football Live Error]:', err.message);
    const fallbackResult = {
      status: 'fallback',
      totalLive: FALLBACK_MATCHES.filter(m => m.status === 'LIVE').length,
      matches: FALLBACK_MATCHES.filter(m => m.status === 'LIVE'),
      isFallback: true,
      error: err.message
    };
    return res.json(fallbackResult);
  }
}

/**
 * GET /api/football/matches?date=YYYYMMDD - Matches by specific date (defaults to today)
 */
export async function handleFootballMatchesByDate(req: Request, res: Response) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const defaultDateStr = `${year}${month}${day}`;

  const queryDate = (req.query.date as string) || defaultDateStr;
  const cleanDate = queryDate.replace(/[^0-9]/g, '');

  const cacheKey = `football_matches_${cleanDate}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MATCHES_MS) {
    return res.json(cached.data);
  }

  try {
    const apiRes = await axios.get(`${BASE_URL}/football-get-matches-by-date?date=${cleanDate}`, {
      headers: getHeaders(),
      timeout: 10000
    });

    const rawMatches = apiRes.data?.response?.matches || [];
    const normalized = rawMatches.map((m: any) => normalizeMatch(m));

    const result = {
      status: 'success',
      date: cleanDate,
      totalMatches: normalized.length,
      matches: normalized.length > 0 ? normalized : FALLBACK_MATCHES,
      isFallback: normalized.length === 0,
      timestamp: Date.now()
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  } catch (err: any) {
    console.warn(`[RapidAPI Football Date ${cleanDate} Error]:`, err.message);
    const fallbackResult = {
      status: 'fallback',
      date: cleanDate,
      totalMatches: FALLBACK_MATCHES.length,
      matches: FALLBACK_MATCHES,
      isFallback: true,
      error: err.message
    };
    return res.json(fallbackResult);
  }
}

/**
 * GET /api/football/leagues - All covered leagues worldwide
 */
export async function handleFootballLeagues(_req: Request, res: Response) {
  const cacheKey = 'football_leagues_all';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_LEAGUES_MS) {
    return res.json(cached.data);
  }

  try {
    const apiRes = await axios.get(`${BASE_URL}/football-get-all-leagues`, {
      headers: getHeaders(),
      timeout: 10000
    });

    const leagues = apiRes.data?.response?.leagues || [];
    const result = {
      status: 'success',
      totalLeagues: leagues.length,
      leagues,
      timestamp: Date.now()
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  } catch (err: any) {
    console.warn('[RapidAPI Football Leagues Error]:', err.message);
    return res.json({
      status: 'fallback',
      totalLeagues: 6,
      leagues: [
        { id: 42, name: 'Champions League', ccode: 'INT' },
        { id: 47, name: 'Premier League', ccode: 'ENG' },
        { id: 87, name: 'La Liga', ccode: 'ESP' },
        { id: 55, name: 'Serie A', ccode: 'ITA' },
        { id: 54, name: 'Bundesliga', ccode: 'GER' },
        { id: 999, name: 'Rwanda Premier League', ccode: 'RWA' }
      ]
    });
  }
}

/**
 * GET /api/football/standings?leagueId=47 - League table standings
 */
export async function handleFootballStandings(req: Request, res: Response) {
  const leagueId = Number(req.query.leagueId) || 47; // Default to Premier League (id: 47)
  const cacheKey = `football_standings_${leagueId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_STANDINGS_MS) {
    return res.json(cached.data);
  }

  try {
    const apiRes = await axios.get(`${BASE_URL}/football-get-standing-all?leagueid=${leagueId}`, {
      headers: getHeaders(),
      timeout: 10000
    });

    const rawStandings = apiRes.data?.response?.standing || [];
    const result = {
      status: 'success',
      leagueId,
      standings: rawStandings,
      timestamp: Date.now()
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  } catch (err: any) {
    console.warn(`[RapidAPI Football Standings League ${leagueId} Error]:`, err.message);
    return res.json({
      status: 'fallback',
      leagueId,
      standings: [],
      error: err.message
    });
  }
}

/**
 * GET /api/football/football-data - Official football-data.org v4 fixtures & live scores
 * Uses X-Auth-Token header with 5-minute server cache to stay well below 10 req/min limit.
 */
export async function handleFootballDataOrgMatches(req: Request, res: Response) {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const competitionCode = typeof req.query.competition === 'string' ? req.query.competition.trim() : '';
  const forceRefresh = req.query.refresh === 'true';

  const cacheKey = `football_data_org_${competitionCode || 'all'}_${statusFilter || 'all'}`;
  const cached = cache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_FOOTBALL_DATA_MS) {
    return res.json({
      ...cached.data,
      fromServerCache: true
    });
  }

  try {
    const endpoint = competitionCode
      ? `https://api.football-data.org/v4/competitions/${encodeURIComponent(competitionCode)}/matches`
      : 'https://api.football-data.org/v4/matches';

    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;

    const apiRes = await axios.get(endpoint, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_TOKEN,
        Accept: 'application/json'
      },
      params,
      timeout: 12000
    });

    const rawMatches = Array.isArray(apiRes.data?.matches) ? apiRes.data.matches : [];
    const normalized = rawMatches.map((m: any) => {
      const apiStatus = String(m.status || 'TIMED').toUpperCase();
      let normalizedStatus: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'UPCOMING';
      if (apiStatus === 'IN_PLAY' || apiStatus === 'PAUSED' || apiStatus === 'LIVE') {
        normalizedStatus = 'LIVE';
      } else if (apiStatus === 'FINISHED') {
        normalizedStatus = 'FINISHED';
      }

      const fullHome = m.score?.fullTime?.home;
      const fullAway = m.score?.fullTime?.away;
      const halfHome = m.score?.halfTime?.home;
      const halfAway = m.score?.halfTime?.away;

      const homeScore = typeof fullHome === 'number' ? fullHome : (typeof halfHome === 'number' ? halfHome : undefined);
      const awayScore = typeof fullAway === 'number' ? fullAway : (typeof halfAway === 'number' ? halfAway : undefined);

      const kickoffDate = m.utcDate ? new Date(m.utcDate) : null;
      const formattedTime = kickoffDate && !isNaN(kickoffDate.getTime())
        ? kickoffDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Today';

      return {
        id: `fd_${m.id}`,
        externalId: m.id,
        leagueId: m.competition?.id,
        leagueName: m.competition?.name || 'International Competition',
        leagueCode: m.competition?.code || '',
        leagueEmblem: m.competition?.emblem || '',
        areaName: m.area?.name || '',
        areaFlag: m.area?.flag || '',
        utcDate: m.utcDate || '',
        time: formattedTime,
        apiStatus,
        status: normalizedStatus,
        minute: apiStatus === 'PAUSED' ? 'HT' : (apiStatus === 'IN_PLAY' ? 'LIVE' : undefined),
        matchday: m.matchday,
        home: {
          id: m.homeTeam?.id,
          name: m.homeTeam?.shortName || m.homeTeam?.name || 'Home Team',
          fullName: m.homeTeam?.name || 'Home Team',
          tla: m.homeTeam?.tla || '',
          score: homeScore,
          logo: m.homeTeam?.crest || ''
        },
        away: {
          id: m.awayTeam?.id,
          name: m.awayTeam?.shortName || m.awayTeam?.name || 'Away Team',
          fullName: m.awayTeam?.name || 'Away Team',
          tla: m.awayTeam?.tla || '',
          score: awayScore,
          logo: m.awayTeam?.crest || ''
        },
        scoreStr: homeScore !== undefined && awayScore !== undefined ? `${homeScore} - ${awayScore}` : 'VS',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        commentaryLanguage: 'Live Match Center (football-data.org)',
        serverCount: 3,
        provider: 'football-data.org'
      };
    });

    const result = {
      status: 'success',
      provider: 'football-data.org',
      count: normalized.length,
      matches: normalized,
      timestamp: Date.now()
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.json(result);
  } catch (err: any) {
    console.warn('[football-data.org API Error]:', err.response?.status, err.message);
    if (cached) {
      return res.json({
        ...cached.data,
        stale: true
      });
    }
    return res.json({
      status: 'fallback',
      provider: 'football-data.org',
      count: FALLBACK_MATCHES.length,
      matches: FALLBACK_MATCHES.map((m) => ({
        ...m,
        apiStatus: m.status,
        utcDate: new Date().toISOString(),
        provider: 'fallback'
      })),
      isFallback: true,
      error: err.message,
      timestamp: Date.now()
    });
  }
}

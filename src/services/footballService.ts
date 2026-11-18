/**
 * Client Service for Football Fixtures & Live Scores
 * Supports football-data.org (with 5-min localStorage caching & X-Auth-Token proxy)
 * and RapidAPI Live Football Data endpoints.
 */

export interface FootballTeam {
  id?: number;
  name: string;
  fullName?: string;
  tla?: string;
  score?: number;
  logo: string;
}

export interface FootballMatchItem {
  id: string | number;
  leagueId?: number;
  leagueName: string;
  leagueEmblem?: string;
  areaName?: string;
  time: string;
  utcDate?: string;
  apiStatus?: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  minute?: string;
  home: FootballTeam;
  away: FootballTeam;
  scoreStr?: string;
  streamUrl: string;
  commentaryLanguage: string;
  serverCount: number;
  provider?: string;
}

export interface FootballLeagueItem {
  id: number;
  name: string;
  localizedName?: string;
  ccode?: string;
}

export interface StandingRow {
  name: string;
  shortName: string;
  id: number;
  rank?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  scoresFor?: number;
  scoresAgainst?: number;
  goalConDiff?: number;
  pts?: number;
  idx?: number;
}

const FOOTBALL_DATA_TOKEN = '0a8279e74c4a4d01a10a2f4ab9c0924a';
const FOOTBALL_DATA_CACHE_KEY = 'lionel_football_data_org_cache_v1';
const FOOTBALL_DATA_CACHE_TTL_MS = 5 * 60 * 1000; // Strictly cache for 5 minutes (10 req/min free limit)

// Client-side quick cache to preserve speed
let cachedLive: { data: FootballMatchItem[]; timestamp: number } | null = null;
const LIVE_CLIENT_TTL = 15 * 1000; // 15 seconds

/**
 * Fetch football fixtures and live scores from football-data.org API
 * Uses backend proxy (/api/football/football-data) with 5-minute localStorage caching
 * and CORS proxy fallback if needed.
 */
export async function fetchFootballDataOrgMatches(forceRefresh = false): Promise<{
  matches: FootballMatchItem[];
  fromCache: boolean;
  cachedAt: number;
  isFallback: boolean;
}> {
  // 1. Check 5-minute localStorage cache first
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(FOOTBALL_DATA_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.matches) &&
          typeof parsed.timestamp === 'number' &&
          Date.now() - parsed.timestamp < FOOTBALL_DATA_CACHE_TTL_MS
        ) {
          return {
            matches: parsed.matches,
            fromCache: true,
            cachedAt: parsed.timestamp,
            isFallback: Boolean(parsed.isFallback),
          };
        }
      }
    } catch {
      // Ignore malformed cache
    }
  }

  // 2. Fetch through backend proxy (avoiding browser CORS restriction on api.football-data.org)
  try {
    const url = forceRefresh ? '/api/football/football-data?refresh=true' : '/api/football/football-data';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const matches: FootballMatchItem[] = (data.matches || []).map((m: any) => ({
      ...m,
      streamUrl: m.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      commentaryLanguage: m.commentaryLanguage || 'Live Match Center (football-data.org)',
      serverCount: m.serverCount || 3,
    }));

    const now = Date.now();
    if (typeof window !== 'undefined' && matches.length > 0) {
      try {
        window.localStorage.setItem(
          FOOTBALL_DATA_CACHE_KEY,
          JSON.stringify({ timestamp: now, matches, isFallback: Boolean(data.isFallback) })
        );
      } catch {
        // Ignore storage quota errors
      }
    }

    return {
      matches,
      fromCache: false,
      cachedAt: now,
      isFallback: Boolean(data.isFallback),
    };
  } catch (backendErr) {
    // 3. Reliable CORS proxy fallback with exact X-Auth-Token header
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent('https://api.football-data.org/v4/matches')}`;
      const res = await fetch(proxyUrl, {
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_TOKEN,
          Accept: 'application/json',
        },
      });
      if (!res.ok) throw new Error(`CORS Proxy HTTP ${res.status}`);
      const apiData = await res.json();
      const matches: FootballMatchItem[] = (apiData.matches || []).map((m: any) => {
        const apiStatus = String(m.status || 'TIMED').toUpperCase();
        const status: 'LIVE' | 'UPCOMING' | 'FINISHED' =
          apiStatus === 'IN_PLAY' || apiStatus === 'PAUSED'
            ? 'LIVE'
            : apiStatus === 'FINISHED'
              ? 'FINISHED'
              : 'UPCOMING';
        const homeScore = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? undefined;
        const awayScore = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? undefined;
        const kickoff = m.utcDate
          ? new Date(m.utcDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Today';

        return {
          id: `fd_${m.id}`,
          leagueId: m.competition?.id,
          leagueName: m.competition?.name || 'Football Competition',
          leagueEmblem: m.competition?.emblem || '',
          time: kickoff,
          utcDate: m.utcDate,
          apiStatus,
          status,
          minute: apiStatus === 'PAUSED' ? 'HT' : apiStatus === 'IN_PLAY' ? 'LIVE' : undefined,
          home: {
            id: m.homeTeam?.id,
            name: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
            score: typeof homeScore === 'number' ? homeScore : undefined,
            logo: m.homeTeam?.crest || '',
          },
          away: {
            id: m.awayTeam?.id,
            name: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
            score: typeof awayScore === 'number' ? awayScore : undefined,
            logo: m.awayTeam?.crest || '',
          },
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          commentaryLanguage: 'Live Match Center (football-data.org)',
          serverCount: 3,
          provider: 'football-data.org',
        };
      });

      const now = Date.now();
      if (typeof window !== 'undefined' && matches.length > 0) {
        try {
          window.localStorage.setItem(
            FOOTBALL_DATA_CACHE_KEY,
            JSON.stringify({ timestamp: now, matches, isFallback: false })
          );
        } catch {
          // Ignore quota
        }
      }

      return { matches, fromCache: false, cachedAt: now, isFallback: false };
    } catch (fallbackErr) {
      console.warn('[Football Service] Both proxy and fallback failed:', backendErr, fallbackErr);
      return { matches: [], fromCache: false, cachedAt: Date.now(), isFallback: true };
    }
  }
}

/**
 * Fetch ongoing live matches
 */
export async function fetchLiveFootballMatches(): Promise<{ matches: FootballMatchItem[]; isFallback: boolean }> {
  if (cachedLive && Date.now() - cachedLive.timestamp < LIVE_CLIENT_TTL) {
    return { matches: cachedLive.data, isFallback: false };
  }

  try {
    const res = await fetch('/api/football/live');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const matches: FootballMatchItem[] = (data.matches || []).map((m: any) => ({
      ...m,
      streamUrl: m.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      commentaryLanguage: m.commentaryLanguage || 'Kinyarwanda & English',
      serverCount: m.serverCount || 4
    }));

    cachedLive = { data: matches, timestamp: Date.now() };
    return { matches, isFallback: Boolean(data.isFallback) };
  } catch (err) {
    console.warn('[Football Service] Live fetch error:', err);
    return { matches: [], isFallback: true };
  }
}

/**
 * Fetch matches for a specific date (YYYYMMDD or default today)
 */
export async function fetchFootballMatchesByDate(dateStr?: string): Promise<{ matches: FootballMatchItem[]; isFallback: boolean }> {
  try {
    const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    const res = await fetch(`/api/football/matches${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const matches: FootballMatchItem[] = (data.matches || []).map((m: any) => ({
      ...m,
      streamUrl: m.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      commentaryLanguage: m.commentaryLanguage || 'Kinyarwanda & English',
      serverCount: m.serverCount || 4
    }));
    return { matches, isFallback: Boolean(data.isFallback) };
  } catch (err) {
    console.warn('[Football Service] Matches by date fetch error:', err);
    return { matches: [], isFallback: true };
  }
}

/**
 * Fetch all available leagues
 */
export async function fetchFootballLeagues(): Promise<FootballLeagueItem[]> {
  try {
    const res = await fetch('/api/football/leagues');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.leagues || [];
  } catch (err) {
    console.warn('[Football Service] Leagues fetch error:', err);
    return [];
  }
}

/**
 * Fetch league standings table
 */
export async function fetchFootballStandings(leagueId: number = 47): Promise<StandingRow[]> {
  try {
    const res = await fetch(`/api/football/standings?leagueId=${leagueId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.standings || [];
  } catch (err) {
    console.warn('[Football Service] Standings fetch error:', err);
    return [];
  }
}

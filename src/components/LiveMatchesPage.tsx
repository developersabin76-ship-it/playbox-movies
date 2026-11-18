import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Play,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Search,
  Table,
  Flame,
  Clock
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import {
  fetchLiveFootballMatches,
  fetchFootballMatchesByDate,
  fetchFootballStandings,
  fetchFootballDataOrgMatches,
  FootballMatchItem,
  StandingRow
} from '../services/footballService';

export interface LiveMatchItem {
  id: string;
  tournament: string;
  leagueEmblem?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  apiStatus?: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  minute?: string;
  streamUrl: string;
  commentaryLanguage: string;
  serverCount: number;
  provider?: string;
}

const FALLBACK_CREST = '/favicon.svg';

export const SAMPLE_LIVE_MATCHES: LiveMatchItem[] = [
  {
    id: 'match_1',
    tournament: 'UEFA Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Manchester City',
    homeLogo: FALLBACK_CREST,
    awayLogo: FALLBACK_CREST,
    homeScore: 2,
    awayScore: 1,
    time: '21:00 CAT',
    status: 'LIVE',
    minute: "68'",
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    commentaryLanguage: 'Kinyarwanda & English',
    serverCount: 4
  },
  {
    id: 'match_2',
    tournament: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeLogo: FALLBACK_CREST,
    awayLogo: FALLBACK_CREST,
    homeScore: 3,
    awayScore: 0,
    time: '18:30 CAT',
    status: 'LIVE',
    minute: "42'",
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    commentaryLanguage: 'Kinyarwanda (Radio 1 & TV10)',
    serverCount: 3
  },
  {
    id: 'match_3',
    tournament: 'Rwanda Premier League',
    homeTeam: 'APR FC',
    awayTeam: 'Rayon Sports',
    homeLogo: FALLBACK_CREST,
    awayLogo: FALLBACK_CREST,
    homeScore: 1,
    awayScore: 1,
    time: '15:00 CAT',
    status: 'LIVE',
    minute: "79'",
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    commentaryLanguage: 'Kinyarwanda Direct (RBA & Isango)',
    serverCount: 5
  },
  {
    id: 'match_4',
    tournament: 'Spanish La Liga',
    homeTeam: 'Barcelona',
    awayTeam: 'Atletico Madrid',
    homeLogo: FALLBACK_CREST,
    awayLogo: FALLBACK_CREST,
    time: 'Tomorrow 22:00 CAT',
    status: 'UPCOMING',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    commentaryLanguage: 'Kinyarwanda & French',
    serverCount: 3
  }
];

function toLiveMatch(m: FootballMatchItem): LiveMatchItem {
  return {
    id: String(m.id),
    tournament: m.leagueName || 'International League',
    leagueEmblem: m.leagueEmblem,
    homeTeam: m.home?.name || 'Home Team',
    awayTeam: m.away?.name || 'Away Team',
    homeLogo: m.home?.logo || FALLBACK_CREST,
    awayLogo: m.away?.logo || FALLBACK_CREST,
    homeScore: m.home?.score,
    awayScore: m.away?.score,
    time: m.time || 'Today',
    apiStatus: m.apiStatus,
    status: m.status || 'UPCOMING',
    minute: m.minute,
    streamUrl: m.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    commentaryLanguage: m.commentaryLanguage || 'Kinyarwanda & English',
    serverCount: m.serverCount || 4,
    provider: m.provider
  };
}

interface LiveMatchesPageProps {
  onBack?: () => void;
  initialMatchId?: string;
}

export const LiveMatchesPage: React.FC<LiveMatchesPageProps> = ({ onBack, initialMatchId }) => {
  const [activeTab, setActiveTab] = useState<'FIXTURES' | 'LIVE' | 'TODAY' | 'STANDINGS'>('FIXTURES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('ALL');

  // Match Data State
  const [footballDataMatches, setFootballDataMatches] = useState<LiveMatchItem[]>([]);
  const [footballDataFromCache, setFootballDataFromCache] = useState<boolean>(false);
  const [liveMatches, setLiveMatches] = useState<LiveMatchItem[]>([]);
  const [todayMatches, setTodayMatches] = useState<LiveMatchItem[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(47);

  // Status & Loading State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  // Active Playback Context
  const [selectedMatch, setSelectedMatch] = useState<LiveMatchItem>(SAMPLE_LIVE_MATCHES[0]);
  const [activeServer, setActiveServer] = useState<number>(1);

  const loadMatches = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [fdRes, liveRes, todayRes] = await Promise.all([
        fetchFootballDataOrgMatches(isManualRefresh),
        fetchLiveFootballMatches(),
        fetchFootballMatchesByDate()
      ]);

      const fdList = (fdRes.matches || []).map(toLiveMatch);
      const liveList = (liveRes.matches || []).map(toLiveMatch);
      const todayList = (todayRes.matches || []).map(toLiveMatch);

      const effectiveFd = fdList.length > 0 ? fdList : SAMPLE_LIVE_MATCHES;
      const effectiveLive = liveList.length > 0 ? liveList : SAMPLE_LIVE_MATCHES.filter((m) => m.status === 'LIVE');
      const effectiveToday = todayList.length > 0 ? todayList : SAMPLE_LIVE_MATCHES;

      setFootballDataMatches(effectiveFd);
      setFootballDataFromCache(fdRes.fromCache);
      setLiveMatches(effectiveLive);
      setTodayMatches(effectiveToday);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      setSelectedMatch((prev) => {
        const combined = [...effectiveFd, ...effectiveLive, ...effectiveToday];
        if (initialMatchId) {
          const found = combined.find((m) => m.id === initialMatchId);
          if (found) return found;
        }
        const currentFound = combined.find((m) => m.id === prev?.id);
        return currentFound || effectiveFd[0] || effectiveLive[0] || SAMPLE_LIVE_MATCHES[0];
      });
    } catch (err) {
      console.warn('[LiveMatchesPage] Failed to fetch football data:', err);
      setFootballDataMatches(SAMPLE_LIVE_MATCHES);
      setLiveMatches(SAMPLE_LIVE_MATCHES.filter((m) => m.status === 'LIVE'));
      setTodayMatches(SAMPLE_LIVE_MATCHES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [initialMatchId]);

  const loadStandings = useCallback(async (leagueId: number) => {
    try {
      const rows = await fetchFootballStandings(leagueId);
      setStandings(rows);
    } catch (err) {
      console.warn('[LiveMatchesPage] Standings load error:', err);
    }
  }, []);

  useEffect(() => {
    loadMatches(false);
  }, [loadMatches]);

  useEffect(() => {
    if (activeTab === 'STANDINGS') {
      loadStandings(selectedLeagueId);
    }
  }, [activeTab, selectedLeagueId, loadStandings]);

  // Periodic refresh respects the 5-min localStorage cache for football-data.org
  useEffect(() => {
    const interval = setInterval(() => {
      loadMatches(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadMatches]);

  const currentPool =
    activeTab === 'FIXTURES'
      ? footballDataMatches
      : activeTab === 'LIVE'
        ? liveMatches
        : todayMatches;

  const filteredMatches = useMemo(() => {
    return currentPool.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.tournament.toLowerCase().includes(q);

      const matchesLeague =
        selectedLeagueFilter === 'ALL' ||
        m.tournament.toLowerCase().includes(selectedLeagueFilter.toLowerCase());

      return matchesSearch && matchesLeague;
    });
  }, [currentPool, searchQuery, selectedLeagueFilter]);

  const topLeagues = useMemo(() => {
    const unique = Array.from(new Set(currentPool.map((m) => m.tournament))).slice(0, 6);
    return [
      { id: 'ALL', label: 'All Leagues' },
      ...unique.map((name) => ({ id: name, label: name }))
    ];
  }, [currentPool]);

  return (
    <div className="min-h-screen w-full bg-[#02050c] text-white p-3 sm:p-6 lg:pl-16 pb-28">
      <div className="max-w-[1650px] mx-auto space-y-6">
        {/* TOP HEADER & CACHE STATUS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/40 pb-5">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-md"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.4)]">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                IMIKINO LIVE <span className="text-cyan-400">FOOTBALL MATCHES</span>
              </h1>
              <p className="text-xs text-slate-400">
                Fixtures, live scores & crests powered by football-data.org (5-min cached) & RapidAPI Sports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-cyan-300 font-mono tabular-nums">
              {footballDataMatches.length} Fixtures · {liveMatches.length} Live · {footballDataFromCache ? '5m Cache Hit' : 'Fresh Sync'}
            </span>
            <button
              onClick={() => loadMatches(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : `Refresh (${lastUpdated})`}</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#060e20] p-2 rounded-2xl border border-cyan-900/40">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setActiveTab('FIXTURES'); setSelectedLeagueFilter('ALL'); }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'FIXTURES'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_16px_rgba(0,240,255,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>FOOTBALL FIXTURES ({footballDataMatches.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('LIVE'); setSelectedLeagueFilter('ALL'); }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'LIVE'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_16px_rgba(0,240,255,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
              }`}
            >
              <span>LIVE NONAHA ({liveMatches.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('TODAY'); setSelectedLeagueFilter('ALL'); }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'TODAY'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_16px_rgba(0,240,255,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>IMIKINO YA NONE ({todayMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('STANDINGS')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'STANDINGS'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_16px_rgba(0,240,255,0.45)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>STANDINGS</span>
            </button>
          </div>

          {activeTab !== 'STANDINGS' && (
            <div className="relative min-w-[230px]">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-cyan-900/60 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* STANDINGS VIEW */}
        {activeTab === 'STANDINGS' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 47, name: 'Premier League (England)' },
                { id: 87, name: 'La Liga (Spain)' },
                { id: 55, name: 'Serie A (Italy)' },
                { id: 54, name: 'Bundesliga (Germany)' },
                { id: 53, name: 'Ligue 1 (France)' }
              ].map((lg) => (
                <button
                  key={lg.id}
                  onClick={() => setSelectedLeagueId(lg.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedLeagueId === lg.id
                      ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-[#060e20] text-slate-300 hover:text-white border border-cyan-900/40'
                  }`}
                >
                  {lg.name}
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-[#060c1c] border border-cyan-900/40 overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950/70 border-b border-cyan-900/40 flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cyan-400" />
                  Live League Standings
                </h3>
                <span className="text-xs text-cyan-400 font-mono">Table</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-cyan-900/30 text-slate-400 font-bold bg-slate-950/40">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-3 text-center">P</th>
                      <th className="py-3 px-3 text-center">W</th>
                      <th className="py-3 px-3 text-center">D</th>
                      <th className="py-3 px-3 text-center">L</th>
                      <th className="py-3 px-3 text-center">GD</th>
                      <th className="py-3 px-4 text-center font-black text-cyan-300">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {standings.length > 0 ? (
                      standings.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-cyan-500/5 transition-colors font-medium">
                          <td className="py-3 px-4 font-bold text-slate-400">{row.rank || row.idx || idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                            <img
                              src={`https://images.fotmob.com/image_resources/logo/teamlogo/${row.id}.png`}
                              alt={row.name}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST;
                              }}
                            />
                            <span>{row.name || row.shortName}</span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300">{row.played ?? '-'}</td>
                          <td className="py-3 px-3 text-center text-slate-300">{row.wins ?? '-'}</td>
                          <td className="py-3 px-3 text-center text-slate-300">{row.draws ?? '-'}</td>
                          <td className="py-3 px-3 text-center text-slate-300">{row.losses ?? '-'}</td>
                          <td className="py-3 px-3 text-center text-slate-300 font-mono">
                            {row.goalConDiff !== undefined ? (row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff) : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-cyan-300 text-sm">{row.pts ?? '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <p className="font-bold">Loading league standings...</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FIXTURES & MATCH STREAM VIEW */}
        {activeTab !== 'STANDINGS' && (
          <div className="space-y-6">
            {/* Match Video Player + Active Match Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-black border border-cyan-400/40 shadow-[0_0_30px_rgba(0,240,255,0.2)] aspect-video">
                  <VideoPlayer
                    key={selectedMatch.id + activeServer}
                    streamUrl={selectedMatch.streamUrl}
                    title={`${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
                    subtitle={`${selectedMatch.tournament} · Server ${activeServer}`}
                    autoPlay={true}
                  />
                </div>

                <div className="p-5 rounded-3xl bg-[#060c1c] border border-cyan-900/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold">
                      <span>{selectedMatch.tournament}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedMatch.time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="uppercase">{selectedMatch.minute || selectedMatch.apiStatus || selectedMatch.status}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-2">
                        <img
                          src={selectedMatch.homeLogo || FALLBACK_CREST}
                          alt={selectedMatch.homeTeam}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST; }}
                          className="w-6 h-6 object-contain"
                        />
                        {selectedMatch.homeTeam}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 font-mono text-cyan-300 border border-cyan-900/50 tabular-nums">
                        {selectedMatch.homeScore !== undefined && selectedMatch.awayScore !== undefined
                          ? `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`
                          : 'VS'}
                      </span>
                      <span className="flex items-center gap-2">
                        <img
                          src={selectedMatch.awayLogo || FALLBACK_CREST}
                          alt={selectedMatch.awayTeam}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST; }}
                          className="w-6 h-6 object-contain"
                        />
                        {selectedMatch.awayTeam}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedMatch.commentaryLanguage}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {[1, 2, 3, 4].slice(0, selectedMatch.serverCount || 4).map((s) => (
                      <button
                        key={s}
                        onClick={() => setActiveServer(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          activeServer === s
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        HD {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Scrollable Fixtures Selector */}
              <div className="lg:col-span-5 space-y-3 bg-[#060c1c] border border-cyan-900/40 rounded-3xl p-4 sm:p-5 shadow-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {topLeagues.map((lg) => (
                    <button
                      key={lg.id}
                      onClick={() => setSelectedLeagueFilter(lg.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        selectedLeagueFilter === lg.id
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {lg.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    <span>Matches ({filteredMatches.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {activeTab === 'FIXTURES' ? 'football-data.org' : 'RapidAPI Live'}
                  </span>
                </div>

                {isLoading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Loading football fixtures...</div>
                ) : (
                  <div className="space-y-2.5 max-h-[540px] overflow-y-auto no-scrollbar pr-1">
                    {filteredMatches.length > 0 ? (
                      filteredMatches.map((match) => {
                        const isSelected = match.id === selectedMatch.id;
                        const isLive = match.status === 'LIVE';
                        return (
                          <button
                            type="button"
                            key={match.id}
                            onClick={() => {
                              setSelectedMatch(match);
                              setActiveServer(1);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#071936] to-[#040e24] border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                                : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-semibold">
                              <span className="text-cyan-400 truncate max-w-[200px] flex items-center gap-1.5">
                                {match.leagueEmblem && (
                                  <img
                                    src={match.leagueEmblem}
                                    alt={match.tournament}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    className="w-4 h-4 object-contain"
                                  />
                                )}
                                {match.tournament}
                              </span>
                              <span className={`font-mono ${isLive ? 'text-cyan-300 font-black' : 'text-slate-400'}`}>
                                {isLive ? `LIVE ${match.minute || ''}` : match.apiStatus || match.time}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={match.homeLogo || FALLBACK_CREST}
                                    alt={match.homeTeam}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST; }}
                                    className="w-5 h-5 object-contain shrink-0"
                                  />
                                  <p className="text-xs font-black truncate text-white">{match.homeTeam}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <img
                                    src={match.awayLogo || FALLBACK_CREST}
                                    alt={match.awayTeam}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST; }}
                                    className="w-5 h-5 object-contain shrink-0"
                                  />
                                  <p className="text-xs font-black truncate text-white">{match.awayTeam}</p>
                                </div>
                              </div>

                              <div className="text-right font-mono font-black text-sm text-cyan-300 px-2.5 py-1 rounded bg-slate-900 border border-cyan-900/40 shrink-0 tabular-nums">
                                {match.homeScore !== undefined && match.awayScore !== undefined ? (
                                  <>
                                    <div>{match.homeScore}</div>
                                    <div>{match.awayScore}</div>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">VS</span>
                                )}
                              </div>

                              <div
                                className={`p-2 rounded-xl transition-colors shrink-0 ${
                                  isSelected
                                    ? 'bg-cyan-400 text-slate-950'
                                    : 'bg-cyan-500/10 group-hover:bg-cyan-400 group-hover:text-slate-950 text-cyan-400'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <Trophy className="w-8 h-8 text-cyan-400 mx-auto opacity-60" />
                        <p className="text-xs font-bold">No matches found for this filter.</p>
                        <button
                          onClick={() => { setSelectedLeagueFilter('ALL'); setSearchQuery(''); }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-cyan-400 text-xs font-bold border border-cyan-900/40 cursor-pointer"
                        >
                          Show All Matches
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* FULL-WIDTH MATCH FIXTURE CARDS GRID (Showing League, Team Crests, Kickoff/Status, Score) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">
                  All Match Fixtures & Live Scoreboard
                </h3>
                <span className="text-xs text-slate-400 tabular-nums">
                  {filteredMatches.length} matches shown
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMatches.slice(0, 24).map((match) => {
                  const isLive = match.status === 'LIVE';
                  return (
                    <button
                      type="button"
                      key={`card_${match.id}`}
                      onClick={() => {
                        setSelectedMatch(match);
                        setActiveServer(1);
                      }}
                      className="text-left p-4 rounded-2xl bg-[#060e20] border border-cyan-900/40 hover:border-cyan-400/70 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      {/* Top: League Name + Kickoff Time / Status */}
                      <div className="flex items-center justify-between gap-2 text-xs border-b border-cyan-900/30 pb-2">
                        <span className="font-bold text-cyan-300 truncate flex items-center gap-1.5">
                          {match.leagueEmblem && (
                            <img
                              src={match.leagueEmblem}
                              alt={match.tournament}
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          {match.tournament}
                        </span>
                        <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {isLive ? `LIVE ${match.minute || ''}` : match.time}
                        </span>
                      </div>

                      {/* Middle: Home Crest + Name vs Score vs Away Crest + Name */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 flex flex-col items-center text-center gap-1.5 min-w-0">
                          <img
                            src={match.homeLogo || FALLBACK_CREST}
                            alt={match.homeTeam}
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST; }}
                            className="w-10 h-10 object-contain"
                          />
                          <span className="text-xs font-bold text-white truncate w-full">{match.homeTeam}</span>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-slate-950 border border-cyan-900/50 text-center shrink-0">
                          <div className="font-mono font-black text-base text-cyan-300 tabular-nums">
                            {match.homeScore !== undefined && match.awayScore !== undefined
                              ? `${match.homeScore} : ${match.awayScore}`
                              : 'VS'}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                            {match.apiStatus || match.status}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center text-center gap-1.5 min-w-0">
                          <img
                            src={match.awayLogo || FALLBACK_CREST}
                            alt={match.awayTeam}
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_CREST; }}
                            className="w-10 h-10 object-contain"
                          />
                          <span className="text-xs font-bold text-white truncate w-full">{match.awayTeam}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

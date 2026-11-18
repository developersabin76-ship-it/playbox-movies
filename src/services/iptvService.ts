/**
 * IPTV-ORG Public Live TV Service
 * Fetches channels.json, streams.json, and logos.json, joins them on channel id,
 * and strictly filters to HTTPS-only streams so browser playback is never mixed-content blocked.
 */

import { TVChannelItem } from '../types';

export const IPTV_ENDPOINTS = {
  channels: 'https://iptv-org.github.io/api/channels.json',
  streams: 'https://iptv-org.github.io/api/streams.json',
  logos: 'https://iptv-org.github.io/api/logos.json',
};

interface RawChannel {
  id: string;
  name: string;
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  closed?: string | null;
  website?: string | null;
}

interface RawStream {
  channel?: string | null;
  url: string;
  quality?: string | null;
}

interface RawLogo {
  channel: string;
  url: string;
}

let memoryCache: { timestamp: number; channels: TVChannelItem[] } | null = null;
const MEMORY_CACHE_TTL_MS = 15 * 60 * 1000;

function mapToTVChannelItem(
  id: string,
  name: string,
  countryCode: string,
  categories: string[],
  streamUrl: string,
  logoUrl: string,
  websiteUrl?: string
): TVChannelItem {
  const normalizedCategory =
    categories.length > 0
      ? categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
      : 'General';

  return {
    id: `iptv-org-${id}`,
    name: name || id,
    logo: logoUrl || '/favicon.svg',
    logoUrl: logoUrl || '/favicon.svg',
    country: countryCode || 'INT',
    countryCode: countryCode || 'INT',
    category: normalizedCategory,
    streamUrl,
    streamType: streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
    websiteUrl: websiteUrl || undefined,
    description: `Live IPTV broadcast (${countryCode || 'Global'}) • ${normalizedCategory}`,
    status: 'ONLINE',
    isLive: true,
    isFeatured: countryCode === 'RW' || normalizedCategory.toLowerCase().includes('sport'),
    isActive: true,
    sortOrder: countryCode === 'RW' ? 1 : 50,
    access: 'FREE',
    viewerCount: countryCode === 'RW' ? 6200 : 1850,
    currentProgram: `${name} Live Stream`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch and join iptv-org channels, streams, and logos on channel id (HTTPS streams only).
 */
export async function fetchIptvOrgChannels(): Promise<{
  channels: TVChannelItem[];
  source: 'iptv-org-direct' | 'iptv-org-proxy' | 'cache';
}> {
  if (memoryCache && Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL_MS) {
    return { channels: memoryCache.channels, source: 'cache' };
  }

  try {
    // 1. Direct fetch from iptv-org public JSON endpoints (all 3 have CORS Access-Control-Allow-Origin: *)
    const [channelsRes, streamsRes, logosRes] = await Promise.all([
      fetch(IPTV_ENDPOINTS.channels),
      fetch(IPTV_ENDPOINTS.streams),
      fetch(IPTV_ENDPOINTS.logos),
    ]);

    if (!channelsRes.ok || !streamsRes.ok || !logosRes.ok) {
      throw new Error('Failed to fetch one or more iptv-org JSON feeds');
    }

    const [rawChannels, rawStreams, rawLogos]: [RawChannel[], RawStream[], RawLogo[]] =
      await Promise.all([channelsRes.json(), streamsRes.json(), logosRes.json()]);

    // Match streams by channel id (HTTPS ONLY)
    const streamByChannel = new Map<string, string>();
    for (const s of rawStreams) {
      if (s?.channel && typeof s?.url === 'string' && s.url.startsWith('https://')) {
        const existing = streamByChannel.get(s.channel);
        if (!existing || (!existing.includes('.m3u8') && s.url.includes('.m3u8'))) {
          streamByChannel.set(s.channel, s.url);
        }
      }
    }

    // Match logos by channel id (HTTPS preferred)
    const logoByChannel = new Map<string, string>();
    for (const l of rawLogos) {
      if (l?.channel && typeof l?.url === 'string' && l.url.startsWith('https://')) {
        if (!logoByChannel.has(l.channel)) {
          logoByChannel.set(l.channel, l.url);
        }
      }
    }

    const joined: TVChannelItem[] = [];
    for (const ch of rawChannels) {
      if (!ch?.id || ch.is_nsfw || ch.closed) continue;
      const streamUrl = streamByChannel.get(ch.id);
      if (!streamUrl) continue; // Only keep channels with a valid https:// stream

      const logoUrl = logoByChannel.get(ch.id) || '';
      const categories = Array.isArray(ch.categories) ? ch.categories : [];
      const countryCode = (ch.country || 'INT').toUpperCase();

      joined.push(
        mapToTVChannelItem(
          ch.id,
          ch.name,
          countryCode,
          categories,
          streamUrl,
          logoUrl,
          ch.website || undefined
        )
      );
    }

    // Prioritize Rwanda (RW) and Sports first
    joined.sort((a, b) => {
      const aRw = a.countryCode === 'RW' ? 1 : 0;
      const bRw = b.countryCode === 'RW' ? 1 : 0;
      if (aRw !== bRw) return bRw - aRw;
      const aSp = a.category.toLowerCase().includes('sport') ? 1 : 0;
      const bSp = b.category.toLowerCase().includes('sport') ? 1 : 0;
      if (aSp !== bSp) return bSp - aSp;
      return a.name.localeCompare(b.name);
    });

    memoryCache = { timestamp: Date.now(), channels: joined };
    return { channels: joined, source: 'iptv-org-direct' };
  } catch (directErr) {
    console.warn('[IPTV Service] Direct fetch failed, falling back to backend join proxy:', directErr);
    try {
      const res = await fetch('/api/tv/iptv-org');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: TVChannelItem[] = (data.channels || [])
        .filter((c: any) => typeof c.streamUrl === 'string' && c.streamUrl.startsWith('https://'))
        .map((c: any) =>
          mapToTVChannelItem(
            c.id,
            c.name,
            (c.country || 'INT').toUpperCase(),
            Array.isArray(c.categories) ? c.categories : [],
            c.streamUrl,
            c.logoUrl || '',
            c.websiteUrl
          )
        );
      memoryCache = { timestamp: Date.now(), channels: mapped };
      return { channels: mapped, source: 'iptv-org-proxy' };
    } catch (proxyErr) {
      console.warn('[IPTV Service] Proxy fetch also failed:', proxyErr);
      return { channels: [], source: 'cache' };
    }
  }
}

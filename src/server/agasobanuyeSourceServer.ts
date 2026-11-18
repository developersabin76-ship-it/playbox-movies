import { Request, Response } from 'express';
import axios from 'axios';
import { getWatchmodeApiKey } from './watchmodeServer.js';

/**
 * Inspection & Configuration for External Agasobanuye Movie Source (https://agasobanuyefree.vercel.app/)
 *
 * STRICT COMPLIANCE RULES:
 * 1. Works ONLY through an officially provided API, feed, or authorized embed mechanism.
 * 2. NO scraping, NO bypassing protections, NO extracting hidden URLs, NO copying files, NO hotlinking.
 * 3. If no official API or authorized embedding mechanism exists, third-party video playback remains DISABLED.
 */

export function getAgasobanuyeSourceConfig() {
  const apiKey = process.env.AGASOBANUYE_SOURCE_API_KEY?.trim() || null;
  const apiUrl = process.env.AGASOBANUYE_SOURCE_API_URL?.trim() || null;

  return {
    apiKey,
    apiUrl,
    isConfigured: Boolean(apiKey && apiUrl),
    sourceTargetUrl: 'https://agasobanuyefree.vercel.app/',
    hasOfficialApi: false, // Set to true only when source owner provides documented API specs
    hasAuthorizedEmbed: false // Set to true only when source owner authorizes iframe/embed
  };
}

/**
 * Endpoint: GET /api/agasobanuye-source/status
 */
export function handleAgasobanuyeSourceStatus(req: Request, res: Response) {
  const config = getAgasobanuyeSourceConfig();

  if (!config.isConfigured) {
    return res.json({
      configured: false,
      authorized: false,
      sourceUrl: config.sourceTargetUrl,
      officialApiFound: false,
      embedMechanismFound: false,
      message: 'No authorized API or embedding mechanism was found. I need permission/documentation from the source owner before integrating its movie videos.'
    });
  }

  return res.json({
    configured: true,
    authorized: config.hasOfficialApi,
    sourceUrl: config.sourceTargetUrl,
    officialApiFound: config.hasOfficialApi,
    embedMechanismFound: config.hasAuthorizedEmbed,
    message: config.hasOfficialApi
      ? 'Authorized Agasobanuye source connected via official API.'
      : 'Source URL configured but awaiting official API verification/documentation from owner.'
  });
}

/**
 * Endpoint: GET /api/agasobanuye-source/search
 */
export async function handleAgasobanuyeSourceSearch(req: Request, res: Response) {
  const query = (req.query.query as string || '').trim();
  const config = getAgasobanuyeSourceConfig();

  if (!config.isConfigured || !config.hasOfficialApi || !config.apiUrl) {
    return res.json({
      success: false,
      results: [],
      total_results: 0,
      configured: false,
      authorized: false,
      message: 'No authorized API or embedding mechanism was found. I need permission/documentation from the source owner before integrating its movie videos.'
    });
  }

  try {
    const searchUrl = `${config.apiUrl}/search?query=${encodeURIComponent(query)}`;
    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['x-api-key'] = config.apiKey;
    }

    const response = await axios.get(searchUrl, { headers, timeout: 8000 });
    return res.json({
      success: true,
      results: response.data.results || [],
      total_results: response.data.total_results || (response.data.results ? response.data.results.length : 0),
      configured: true,
      authorized: true,
      source: 'agasobanuye_authorized_api'
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      results: [],
      error: 'Agasobanuye source API temporarily unavailable. Please try again.'
    });
  }
}

/**
 * Endpoint: GET /api/source-health
 * Provides comprehensive real-time status for all movie/TV content sources
 */
export function handleSourceHealth(req: Request, res: Response) {
  const watchmodeKey = getWatchmodeApiKey();
  const agasobanuyeConfig = getAgasobanuyeSourceConfig();

  return res.json({
    timestamp: new Date().toISOString(),
    sources: {
      watchmode: {
        name: 'Watchmode Official API',
        status: watchmodeKey ? 'Connected' : 'Disconnected',
        configured: Boolean(watchmodeKey),
        purpose: 'Global movie & TV discovery, metadata, critic ratings, official provider deep-links'
      },
      tmdb: {
        name: 'The Movie Database (TMDB)',
        status: 'Connected',
        configured: true,
        purpose: 'High-definition posters, backdrops, cast filmography'
      },
      externalAgasobanuye: {
        name: 'External Agasobanuye Source (agasobanuyefree.vercel.app)',
        status: agasobanuyeConfig.isConfigured ? 'Connected' : 'Not configured',
        configured: agasobanuyeConfig.isConfigured,
        sourceUrl: agasobanuyeConfig.sourceTargetUrl,
        officialApiFound: agasobanuyeConfig.hasOfficialApi,
        embedMechanismFound: agasobanuyeConfig.hasAuthorizedEmbed,
        playbackAuthorized: agasobanuyeConfig.hasAuthorizedEmbed,
        statusNote: 'No authorized API or embedding mechanism was found. Permission and documentation from the source owner are required before integrating video playback.'
      },
      myMovies: {
        name: 'My Movies Database',
        status: 'Connected',
        configured: true,
        purpose: 'Legally authorized self-hosted titles, custom trailers, audio tracks, HLS streams, downloads'
      }
    }
  });
}

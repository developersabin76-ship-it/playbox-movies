import React from 'react';

interface MediaCoreLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showTagline?: boolean;
  showFeatures?: boolean;
  isAnimated?: boolean;
  glowIntensity?: number; // 0 to 1
  lightSweepProgress?: number; // 0 to 100 for cinematic sweep
  pulsePlay?: boolean;
  skylineOpacity?: number; // 0 to 1
  borderLightPos?: number; // 0 to 100 percentage around the border
  filmStripRotate?: number; // degrees
}

export const MediaCoreLogo: React.FC<MediaCoreLogoProps> = ({
  size = 'md',
  className = '',
  showTagline = true,
  showFeatures = false,
  isAnimated = false,
  glowIntensity = 1,
  lightSweepProgress = 0,
  pulsePlay = false,
  skylineOpacity = 1,
  borderLightPos = 0,
  filmStripRotate = 0
}) => {
  // Dimension scales
  const dimensions = {
    sm: { width: 140, height: 140, fontSize: 18, tagSize: 8 },
    md: { width: 220, height: 220, fontSize: 26, tagSize: 10 },
    lg: { width: 320, height: 320, fontSize: 36, tagSize: 12 },
    xl: { width: 440, height: 440, fontSize: 48, tagSize: 14 },
    hero: { width: 560, height: 560, fontSize: 58, tagSize: 16 }
  }[size];

  // Unique ID prefix for gradients/filters
  const id = React.useId().replace(/:/g, '_');

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 500"
        className="w-full h-auto max-w-full drop-shadow-[0_15px_35px_rgba(0,180,255,0.25)]"
        style={{
          filter: `drop-shadow(0 0 ${20 * glowIntensity}px rgba(0, 229, 255, ${0.4 * glowIntensity})) drop-shadow(0 0 ${35 * glowIntensity}px rgba(0, 240, 255, ${0.3 * glowIntensity}))`
        }}
      >
        <defs>
          {/* Neon Blue to Specular Cyan Mirror Gradient */}
          <linearGradient id={`${id}-blue-green-neon`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="65%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Electric Cyan Horizontal */}
          <linearGradient id={`${id}-cyan-stream`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0080ff" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>

          {/* Play Button Vibrant Bright Blue Mirror 3D Gradient */}
          <linearGradient id={`${id}-play-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="85%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Film Strip Gradient */}
          <linearGradient id={`${id}-film-cyan`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="45%" stopColor="#0091ff" />
            <stop offset="90%" stopColor="#0052cc" />
            <stop offset="100%" stopColor="#002b80" />
          </linearGradient>

          {/* TV Screen Glass Dark Gradient */}
          <linearGradient id={`${id}-screen-glass`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#0a192f" />
            <stop offset="40%" stopColor="#050e1d" />
            <stop offset="100%" stopColor="#02060d" />
          </linearGradient>

          {/* Kigali Mountains Gradient */}
          <linearGradient id={`${id}-kigali-mountains`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#0077b6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#023e8a" stopOpacity="0.1" />
          </linearGradient>

          {/* City Skyline Gradient */}
          <linearGradient id={`${id}-city-glow`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00bbf9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00509d" stopOpacity="0.2" />
          </linearGradient>

          {/* Neon Glow Filters */}
          <filter id={`${id}-glow-strong`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="18" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${id}-soft-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Specular Light Sweep Gradient */}
          <linearGradient id={`${id}-light-sweep`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="55%" stopColor="rgba(0,229,255,0.6)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* =========================================================
            LAYER 0: BACKGROUND RADIAL AMBIENCE
            ========================================================= */}
        <circle cx="250" cy="220" r="190" fill="#00d2ff" opacity={0.06 * glowIntensity} filter={`url(#${id}-glow-strong)`} />
        <circle cx="280" cy="220" r="160" fill="#00f0ff" opacity={0.05 * glowIntensity} filter={`url(#${id}-glow-strong)`} />

        {/* =========================================================
            LAYER 1: KIGALI MOUNTAINS & CITY SKYLINE SILHOUETTE
            ========================================================= */}
        <g
          id="kigali-skyline"
          opacity={skylineOpacity}
          className="transition-opacity duration-700"
          style={{ transformOrigin: '320px 250px' }}
        >
          {/* Rwandan Rolling Mountains Peak 1 (Distant) */}
          <path
            d="M 280 250 L 375 140 L 460 250 Z"
            fill={`url(#${id}-kigali-mountains)`}
            opacity="0.65"
          />
          {/* Mountain Peak 2 (Foreground Layer) */}
          <path
            d="M 330 255 L 420 160 L 490 260 Z"
            fill={`url(#${id}-kigali-mountains)`}
            opacity="0.8"
          />

          {/* Mountain Ridge Neon Edge Highlights */}
          <path
            d="M 280 250 L 375 140 L 415 190"
            stroke="#00d2ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
            filter={`url(#${id}-soft-glow)`}
          />
          <path
            d="M 360 230 L 420 160 L 480 250"
            stroke="#00e5ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />

          {/* Kigali City Tower Spire & Modern Skyline */}
          {/* Tower Base & Body */}
          <rect x="396" y="195" width="10" height="60" rx="1" fill="#00b4d8" opacity="0.9" />
          {/* Tower Observation Deck / Spire */}
          <ellipse cx="401" cy="195" rx="9" ry="3.5" fill="#00f5d4" />
          <path d="M 401 195 L 401 168" stroke="#00f5d4" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="401" cy="167" r="2" fill="#ffffff" filter={`url(#${id}-soft-glow)`} />

          {/* Modern Kigali High-Rise Buildings with glowing window grid */}
          <rect x="355" y="210" width="16" height="45" rx="1.5" fill="#023e8a" stroke="#00b4d8" strokeWidth="1" />
          <line x1="358" y1="216" x2="368" y2="216" stroke="#00f5d4" strokeWidth="1.2" opacity="0.8" />
          <line x1="358" y1="223" x2="368" y2="223" stroke="#00f5d4" strokeWidth="1.2" opacity="0.8" />
          <line x1="358" y1="230" x2="368" y2="230" stroke="#00f5d4" strokeWidth="1.2" opacity="0.8" />
          <line x1="358" y1="237" x2="368" y2="237" stroke="#00f5d4" strokeWidth="1.2" opacity="0.8" />

          {/* Building 2 (Mid-rise glass tower) */}
          <rect x="373" y="202" width="20" height="53" rx="1.5" fill="#0077b6" stroke="#00e5ff" strokeWidth="1.2" />
          <line x1="377" y1="208" x2="389" y2="208" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
          <line x1="377" y1="215" x2="389" y2="215" stroke="#00e5ff" strokeWidth="1.2" opacity="0.9" />
          <line x1="377" y1="222" x2="389" y2="222" stroke="#00f5d4" strokeWidth="1.2" opacity="0.9" />
          <line x1="377" y1="229" x2="389" y2="229" stroke="#00f0ff" strokeWidth="1.2" opacity="0.9" />
          <line x1="377" y1="236" x2="389" y2="236" stroke="#00f5d4" strokeWidth="1.2" opacity="0.9" />

          {/* Building 3 (Right City Block) */}
          <rect x="408" y="215" width="14" height="40" rx="1.5" fill="#03045e" stroke="#0096c7" strokeWidth="1" />
          <line x1="411" y1="221" x2="419" y2="221" stroke="#00f5d4" strokeWidth="1" opacity="0.8" />
          <line x1="411" y1="228" x2="419" y2="228" stroke="#00f5d4" strokeWidth="1" opacity="0.8" />
          <line x1="411" y1="235" x2="419" y2="235" stroke="#00f5d4" strokeWidth="1" opacity="0.8" />

          {/* Rwandan Evergreen / Pine & Acacia Trees silhouettes */}
          <path d="M 430 255 L 436 230 L 442 255 Z" fill="#00b4d8" opacity="0.9" />
          <path d="M 444 255 L 450 226 L 456 255 Z" fill="#0077b6" opacity="0.95" />
          <path d="M 458 255 L 463 234 L 468 255 Z" fill="#0096c7" opacity="0.85" />
        </g>

        {/* =========================================================
            LAYER 2: DYNAMIC SPIRALING 3D FILM STRIP (LEFT EMBLEM)
            ========================================================= */}
        <g id="film-strip-ribbon" style={{ transform: `rotate(${filmStripRotate}deg)`, transformOrigin: '110px 220px' }}>
          {/* Back Loop Shadow */}
          <path
            d="M 125 105 C 80 120 40 170 45 220 C 50 270 85 305 130 300 C 100 295 72 265 68 225 C 64 180 95 130 145 112 Z"
            fill="#001845"
            opacity="0.9"
          />

          {/* Main 3D Sweeping Ribbon Body */}
          <path
            d="M 155 102 C 105 115 55 160 58 215 C 62 275 105 315 155 305 C 100 300 78 255 78 210 C 78 160 115 118 175 106 Z"
            fill={`url(#${id}-film-cyan)`}
            filter={`url(#${id}-soft-glow)`}
          />

          {/* Film Strip Outer & Inner Neon Edges */}
          <path
            d="M 155 102 C 105 115 55 160 58 215 C 62 275 105 315 155 305"
            stroke="#00e5ff"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            filter={`url(#${id}-soft-glow)`}
          />
          <path
            d="M 175 106 C 115 118 78 160 78 210 C 78 255 100 300 155 305"
            stroke="#0080ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 35mm Sprocket Perforations (Film Holes) */}
          <g fill="#02060d" stroke="#00d2ff" strokeWidth="0.8">
            <rect x="135" y="108" width="9" height="6" rx="1.5" transform="rotate(-20 135 108)" />
            <rect x="108" y="122" width="9" height="6" rx="1.5" transform="rotate(-35 108 122)" />
            <rect x="85" y="145" width="8" height="7" rx="1.5" transform="rotate(-55 85 145)" />
            <rect x="70" y="176" width="7" height="8" rx="1.5" transform="rotate(-75 70 176)" />
            <rect x="66" y="210" width="7" height="9" rx="1.5" transform="rotate(-90 66 210)" />
            <rect x="71" y="245" width="7" height="9" rx="1.5" transform="rotate(-110 71 245)" />
            <rect x="88" y="274" width="8" height="8" rx="1.5" transform="rotate(-130 88 274)" />
            <rect x="115" y="292" width="9" height="7" rx="1.5" transform="rotate(-150 115 292)" />
          </g>

          {/* Inside Sprocket Track Holes */}
          <g fill="#02060d" stroke="#0077b6" strokeWidth="0.6" opacity="0.9">
            <rect x="150" y="114" width="7" height="5" rx="1" transform="rotate(-20 150 114)" />
            <rect x="125" y="130" width="7" height="5" rx="1" transform="rotate(-35 125 130)" />
            <rect x="105" y="154" width="6" height="6" rx="1" transform="rotate(-55 105 154)" />
            <rect x="94" y="182" width="5" height="7" rx="1" transform="rotate(-75 94 182)" />
            <rect x="92" y="212" width="5" height="7" rx="1" transform="rotate(-90 92 212)" />
            <rect x="98" y="242" width="6" height="7" rx="1" transform="rotate(-110 98 242)" />
            <rect x="112" y="266" width="7" height="6" rx="1" transform="rotate(-130 112 266)" />
            <rect x="134" y="280" width="7" height="6" rx="1" transform="rotate(-150 134 280)" />
          </g>
        </g>

        {/* =========================================================
            LAYER 3: RETRO-FUTURISTIC TV ANTENNAS WITH GLOWING ORBS
            ========================================================= */}
        <g id="tv-antennas">
          {/* Left Antenna Rod */}
          <line
            x1="225"
            y1="115"
            x2="160"
            y2="48"
            stroke="#00d2ff"
            strokeWidth="5.5"
            strokeLinecap="round"
            filter={`url(#${id}-soft-glow)`}
          />
          <line
            x1="225"
            y1="115"
            x2="160"
            y2="48"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Left Glowing Orb Tip */}
          <circle cx="158" cy="46" r="14" fill="#00d2ff" filter={`url(#${id}-glow-strong)`} />
          <circle cx="158" cy="46" r="10" fill="#00e5ff" />
          <circle cx="155" cy="43" r="4.5" fill="#ffffff" />

          {/* Right Antenna Rod */}
          <line
            x1="255"
            y1="115"
            x2="315"
            y2="48"
            stroke="#00f0ff"
            strokeWidth="5.5"
            strokeLinecap="round"
            filter={`url(#${id}-soft-glow)`}
          />
          <line
            x1="255"
            y1="115"
            x2="315"
            y2="48"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Right Glowing Orb Tip */}
          <circle cx="317" cy="46" r="14" fill="#00f0ff" filter={`url(#${id}-glow-strong)`} />
          <circle cx="317" cy="46" r="10" fill="#38bdf8" />
          <circle cx="314" cy="43" r="4.5" fill="#ffffff" />
        </g>

        {/* =========================================================
            LAYER 4: MAIN TV MONITOR & NEON BEZEL
            ========================================================= */}
        <g id="tv-monitor-screen">
          {/* Outer Deep Glow Shadow */}
          <rect
            x="122"
            y="110"
            width="240"
            height="175"
            rx="42"
            fill="none"
            stroke={`url(#${id}-blue-green-neon)`}
            strokeWidth="16"
            opacity={0.35 * glowIntensity}
            filter={`url(#${id}-glow-strong)`}
          />

          {/* Main Neon Bezel (Blue on left, Green on right) */}
          <rect
            x="122"
            y="110"
            width="240"
            height="175"
            rx="42"
            fill={`url(#${id}-screen-glass)`}
            stroke={`url(#${id}-blue-green-neon)`}
            strokeWidth="9"
            filter={`url(#${id}-soft-glow)`}
          />

          {/* Inner TV Screen Dark Border Line */}
          <rect
            x="132"
            y="120"
            width="220"
            height="155"
            rx="34"
            fill="none"
            stroke="#020814"
            strokeWidth="3.5"
          />

          {/* TV Glass Specular Reflection Highlight */}
          <path
            d="M 135 125 C 135 125 210 122 280 135 C 330 145 345 180 345 180 L 135 180 Z"
            fill="url(#specular-glass)"
            opacity="0.08"
          />

          {/* Light Sweep Effect Across TV Screen */}
          {lightSweepProgress > 0 && (
            <rect
              x="122"
              y="110"
              width="240"
              height="175"
              rx="42"
              fill={`url(#${id}-light-sweep)`}
              opacity={Math.min(1, lightSweepProgress / 60)}
              style={{
                transform: `translateX(${(lightSweepProgress - 50) * 4}px) rotate(25deg)`,
                transformOrigin: '242px 197px'
              }}
              clipPath={`url(#${id}-screen-clip)`}
            />
          )}

          <clipPath id={`${id}-screen-clip`}>
            <rect x="126" y="114" width="232" height="167" rx="38" />
          </clipPath>

          {/* =========================================================
              LAYER 5: POWER-ON PULSING GREEN PLAY BUTTON (CENTER)
              ========================================================= */}
          <g
            id="glowing-play-button"
            className={pulsePlay ? 'animate-pulse' : ''}
            style={{
              transformOrigin: '245px 197px',
              transform: pulsePlay ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Play Button Outer Glow */}
            <path
              d="M 215 155 L 290 197 L 215 240 Z"
              fill="#00f0ff"
              filter={`url(#${id}-glow-strong)`}
              opacity={0.6 * glowIntensity}
            />

            {/* Play Button 3D Body with rounded vertices */}
            <path
              d="M 218 158 C 218 154 223 151 227 153 L 286 193 C 289 195 289 199 286 201 L 227 241 C 223 243 218 240 218 236 Z"
              fill={`url(#${id}-play-green)`}
              stroke="#e0f2fe"
              strokeWidth="2.5"
              filter={`url(#${id}-soft-glow)`}
            />

            {/* Play Button Inner Specular Flare */}
            <path
              d="M 223 166 L 255 188 L 223 205 Z"
              fill="#ffffff"
              opacity="0.4"
            />
          </g>
        </g>

        {/* =========================================================
            LAYER 6: NEON SWASH / HORIZON ARC BASELINE
            ========================================================= */}
        <g id="horizon-swoosh-arc">
          {/* Main Swash Underneath */}
          <path
            d="M 60 288 C 160 305 320 295 460 270"
            stroke={`url(#${id}-blue-green-neon)`}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            filter={`url(#${id}-glow-strong)`}
          />
          <path
            d="M 70 288 C 170 304 330 294 450 272"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Secondary Lower Cyan Wave Reflection */}
          <path
            d="M 90 300 C 190 314 310 306 430 284"
            stroke="#00e5ff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </g>

        {/* =========================================================
            LAYER 7: ORBITING LASER LIGHT PARTICLE (TRAVELING AROUND LOGO)
            ========================================================= */}
        {isAnimated && (
          <g id="traveling-laser-particle">
            <circle
              cx="242"
              cy="110"
              r="6"
              fill="#ffffff"
              filter={`url(#${id}-glow-strong)`}
              style={{
                offsetPath: `path("M 122 110 H 362 V 285 H 122 Z")`,
                offsetDistance: `${borderLightPos}%`,
                boxShadow: '0 0 20px #00e5ff'
              }}
            />
          </g>
        )}

        {/* =========================================================
            LAYER 8: TYPOGRAPHY — "MediaCoreTV"
            ========================================================= */}
        <g id="brand-typography">
          {/* "Media" in Crisp White */}
          <text
            x="85"
            y="375"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="52"
            letterSpacing="-0.5"
            fill="#ffffff"
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.8))"
          >
            Media
          </text>

          {/* "Core" in Specular Neon Cyan */}
          <text
            x="240"
            y="375"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="52"
            letterSpacing="-0.5"
            fill="#00f0ff"
            filter={`url(#${id}-soft-glow)`}
          >
            Core
          </text>

          {/* "TV" in Neon Electric Sky-Blue */}
          <text
            x="368"
            y="375"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="52"
            letterSpacing="-0.5"
            fill="#38bdf8"
            filter={`url(#${id}-soft-glow)`}
          >
            TV
          </text>
        </g>

        {/* =========================================================
            LAYER 9: TAGLINE — "— STREAM • WATCH • ENJOY —"
            ========================================================= */}
        {showTagline && (
          <g id="brand-tagline">
            {/* Left Accent Line */}
            <line x1="85" y1="412" x2="135" y2="412" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

            {/* Tagline Text with Glowing Separator Dots */}
            <text
              x="250"
              y="417"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="16"
              letterSpacing="5"
              fill="#e2e8f0"
              className="tracking-[0.35em]"
            >
              STREAM <tspan fill="#00e5ff">•</tspan> WATCH <tspan fill="#00f0ff">•</tspan> ENJOY
            </text>

            {/* Right Accent Line */}
            <line x1="365" y1="412" x2="415" y2="412" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </g>
        )}

        {/* =========================================================
            LAYER 10: OPTIONAL 4 PILL CATEGORY BADGES (LIVE TV, MOVIES, SERIES, ANYTIME)
            ========================================================= */}
        {showFeatures && (
          <g id="brand-feature-icons" transform="translate(0, 440)">
            {/* 1. Live TV */}
            <g transform="translate(75, 0)">
              <rect x="0" y="0" width="75" height="34" rx="10" fill="#06122c" stroke="#00d2ff" strokeWidth="1.2" />
              <text x="37" y="21" textAnchor="middle" fontSize="10" fontWeight="900" fill="#00d2ff">LIVE TV</text>
            </g>

            {/* 2. Movies */}
            <g transform="translate(160, 0)">
              <rect x="0" y="0" width="75" height="34" rx="10" fill="#06122c" stroke="#00f0ff" strokeWidth="1.2" />
              <text x="37" y="21" textAnchor="middle" fontSize="10" fontWeight="900" fill="#00f0ff">MOVIES</text>
            </g>

            {/* 3. Series */}
            <g transform="translate(245, 0)">
              <rect x="0" y="0" width="75" height="34" rx="10" fill="#06122c" stroke="#00d2ff" strokeWidth="1.2" />
              <text x="37" y="21" textAnchor="middle" fontSize="10" fontWeight="900" fill="#00d2ff">SERIES</text>
            </g>

            {/* 4. Anytime */}
            <g transform="translate(330, 0)">
              <rect x="0" y="0" width="85" height="34" rx="10" fill="#06122c" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="42" y="21" textAnchor="middle" fontSize="10" fontWeight="900" fill="#38bdf8">ANYTIME</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

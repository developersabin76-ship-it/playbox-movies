import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaCoreLogo } from './MediaCoreLogo';
import { FastForward } from 'lucide-react';

export interface MediaCoreLoadingProps {
  /** Callback fired once animation completes and exit transition finishes */
  onComplete?: () => void;
  /** Whether the loading overlay is currently active */
  isOpen?: boolean;
  /** Target duration in milliseconds (default: 2200ms) */
  minDuration?: number;
  /** Optional custom subtitle / tagline */
  tagline?: string;
  /** Whether user can click to skip intro immediately */
  allowSkip?: boolean;
}

export const MediaCoreLoading: React.FC<MediaCoreLoadingProps> = ({
  onComplete,
  isOpen = true,
  minDuration = 2200,
  allowSkip = true
}) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!isOpen) return;

    if (prefersReducedMotion) {
      const quickTimer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onCompleteRef.current?.();
        }, 200);
      }, 400);
      return () => clearTimeout(quickTimer);
    }

    const duration = minDuration;
    startTimeRef.current = performance.now();

    const updateFrame = (currentTime: number) => {
      const elapsed = currentTime - (startTimeRef.current || currentTime);
      const calculatedProgress = Math.min(100, Math.floor((elapsed / duration) * 100));

      setProgress((prev) => (prev === calculatedProgress ? prev : calculatedProgress));

      if (calculatedProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateFrame);
      } else {
        // Reached 100%: smooth exit
        setIsExiting(true);
        setTimeout(() => {
          onCompleteRef.current?.();
        }, 450);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, minDuration, prefersReducedMotion]);

  const handleSkip = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsExiting(true);
    setTimeout(() => {
      onCompleteRef.current?.();
    }, 150);
  };

  if (!isOpen) return null;

  // Dynamic calculations for pure cinematic logo glow & sweep
  const glowMultiplier = Math.min(1.8, 0.6 + (progress / 100) * 1.2);
  const lightSweepPos = progress >= 25 && progress <= 80 ? ((progress - 25) / 55) * 100 : 0;
  const skylineOpacityVal = Math.min(1, 0.4 + (progress / 100) * 0.6);
  const borderLightPercentage = (progress * 3) % 100;
  const filmStripRotationAngle = (progress / 100) * 10;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="mediacore-loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.06,
            filter: 'blur(10px)',
            transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#010309] text-white select-none overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, #051024 0%, #020612 50%, #000206 100%)'
          }}
        >
          {/* Volumetric Radial Ambient Neon Aura */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none blur-[140px] opacity-45 transition-transform duration-500"
            style={{
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.4) 0%, rgba(0, 255, 102, 0.25) 55%, transparent 75%)',
              transform: `scale(${0.95 + (progress / 100) * 0.2})`
            }}
          />

          {/* Rotating Subtle Ambient Halo Ring */}
          <div
            className="absolute w-[640px] h-[640px] rounded-full border border-cyan-400/15 pointer-events-none"
            style={{
              transform: `rotate(${progress * 1.5}deg)`,
              boxShadow: 'inset 0 0 70px rgba(0, 240, 255, 0.08), 0 0 90px rgba(0, 255, 102, 0.08)'
            }}
          />

          {/* =========================================================
              ONLY THE ICONIC MEDIACORETV LOGO IS VISIBLE
              ========================================================= */}
          <div className="relative z-20 flex flex-col items-center justify-center max-w-xl px-4 text-center">
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 10 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-80 sm:w-96 md:w-[480px]"
            >
              <MediaCoreLogo
                size="hero"
                glowIntensity={glowMultiplier}
                lightSweepProgress={lightSweepPos}
                pulsePlay={true}
                skylineOpacity={skylineOpacityVal}
                isAnimated={true}
                borderLightPos={borderLightPercentage}
                filmStripRotate={filmStripRotationAngle}
                showTagline={true}
                showFeatures={false}
              />
            </motion.div>
          </div>

          {/* Quick Skip Control */}
          {allowSkip && (
            <button
              onClick={handleSkip}
              className="absolute bottom-6 right-6 z-30 px-3.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md group shadow-lg"
              title="Skip intro"
            >
              <span>Skip</span>
              <FastForward className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Smartphone, History, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface DiceRollerProps {
  /** Optional initial dice value (1 to 6) */
  initialValue?: number;
  /** Optional callback fired when roll finishes */
  onRollComplete?: (value: number) => void;
  /** Enable or disable sound effects (Web Audio API synthesized) */
  enableSound?: boolean;
  /** Custom additional CSS classes */
  className?: string;
}

// Face target rotations (X, Y in degrees) to orient the selected face toward the camera
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },       // Front
  2: { x: -90, y: 0 },     // Top
  3: { x: 0, y: -90 },     // Right
  4: { x: 0, y: 90 },      // Left
  5: { x: 90, y: 0 },      // Bottom
  6: { x: 0, y: 180 },     // Back
};

// Standard authentic dice pip positions on a 3x3 grid (indices 0 to 8)
const FACE_PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Synthesized Web Audio physical dice sound effects */
function playDiceSound(type: 'tumble' | 'settle') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'tumble') {
      // Rapid soft tumbles
      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.18 + Math.random() * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450 + Math.random() * 300, time);
        filter.Q.setValueAtTime(3.0, time);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 + Math.random() * 80, time);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.09);
      }
    } else {
      // Final landing impact thud
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, time);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.17);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/** Individual Face of the 3D Cube */
const DiceFace: React.FC<{
  number: number;
  transformStyle: string;
  isFrontFacing?: boolean;
}> = ({ number, transformStyle, isFrontFacing }) => {
  const activePips = FACE_PIPS[number] || [];

  return (
    <div
      className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#1b1b22] via-[#141418] to-[#0e0e11] border border-amber-500/30 p-3 flex items-center justify-center select-none backface-hidden transition-all duration-300 ${
        isFrontFacing ? 'ring-1 ring-amber-400/40' : ''
      }`}
      style={{
        transform: transformStyle,
        boxShadow:
          'inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(212, 175, 55, 0.06)',
      }}
    >
      {/* Subtle luxury corner bracket ornaments */}
      <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-amber-400/30 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-amber-400/30 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-amber-400/30 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-amber-400/30 rounded-br-sm pointer-events-none" />

      {/* 3x3 Authentic Dice Pip Grid */}
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1.5 p-1 items-center justify-items-center">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isActive = activePips.includes(idx);
          if (!isActive) {
            return <div key={idx} className="w-full h-full" />;
          }

          const isCenterOfOne = number === 1 && idx === 4;

          return (
            <div
              key={idx}
              className={`rounded-full transition-transform duration-300 ${
                isCenterOfOne
                  ? 'w-7 h-7 sm:w-8 sm:h-8 shadow-[0_0_14px_rgba(234,179,8,0.85)]'
                  : 'w-4 h-4 sm:w-5 sm:h-5 shadow-[0_0_8px_rgba(234,179,8,0.55)]'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, #fff7cc 0%, #facc15 35%, #ca8a04 70%, #854d0e 100%)',
                boxShadow:
                  'inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.6), 0 0 10px rgba(234, 179, 8, 0.5)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const DiceRoller: React.FC<DiceRollerProps> = ({
  initialValue = 1,
  onRollComplete,
  enableSound: initialSound = true,
  className = '',
}) => {
  const [currentValue, setCurrentValue] = useState<number>(initialValue);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [history, setHistory] = useState<number[]>([initialValue]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSound);
  const [totalRolls, setTotalRolls] = useState<number>(0);

  // Cumulative rotation state (to ensure forward spinning without unwinding glitches)
  const rotationRef = useRef<{ x: number; y: number; z: number }>({
    x: FACE_ROTATIONS[initialValue]?.x || 0,
    y: FACE_ROTATIONS[initialValue]?.y || 0,
    z: 0,
  });

  const [transformStyle, setTransformStyle] = useState<string>(
    `rotateX(${FACE_ROTATIONS[initialValue]?.x || 0}deg) rotateY(${FACE_ROTATIONS[initialValue]?.y || 0}deg) rotateZ(0deg)`
  );

  // Interactive subtle tilt on hover/touch
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const rollDice = useCallback(() => {
    if (isRolling) return;

    setIsRolling(true);

    // 1. Mobile haptic feedback trigger
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // Safe catch for permissions
      }
    }

    // 2. Synthesize audio tumble
    if (soundEnabled) {
      playDiceSound('tumble');
    }

    // 3. Generate random outcome (1 to 6)
    const nextValue = Math.floor(Math.random() * 6) + 1;

    // 4. Calculate continuous rotation angles
    const targetFace = FACE_ROTATIONS[nextValue];

    // Extra full turns (3 to 5 full 360-degree spins on X & Y)
    const extraTurnsX = (3 + Math.floor(Math.random() * 2)) * 360;
    const extraTurnsY = (3 + Math.floor(Math.random() * 2)) * 360;

    // Calculate next cumulative angle matching target modulo
    const currentX = rotationRef.current.x;
    const currentY = rotationRef.current.y;

    // Target angle adjusted for continuous progress
    const nextX = currentX + extraTurnsX + (targetFace.x - (currentX % 360));
    const nextY = currentY + extraTurnsY + (targetFace.y - (currentY % 360));

    rotationRef.current = { x: nextX, y: nextY, z: 0 };

    // Apply rapid rotation transform
    setTransformStyle(`rotateX(${nextX}deg) rotateY(${nextY}deg) rotateZ(0deg)`);

    // 5. Landing settle after 1100ms
    setTimeout(() => {
      setIsRolling(false);
      setCurrentValue(nextValue);
      setHistory((prev) => [nextValue, ...prev.slice(0, 7)]);
      setTotalRolls((prev) => prev + 1);

      if (soundEnabled) {
        playDiceSound('settle');
      }

      // Haptic bump on landing
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // Safe catch
        }
      }

      // Golden confetti celebration on rolling maximum score (6)
      if (nextValue === 6) {
        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#FBBF24', '#D97706', '#FEF08A'],
            disableForReducedMotion: true,
          });
        } catch {
          // confetti optional
        }
      }

      if (onRollComplete) {
        onRollComplete(nextValue);
      }
    }, 1100);
  }, [isRolling, soundEnabled, onRollComplete]);

  // Spacebar keyboard roll support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body && !isRolling) {
        e.preventDefault();
        rollDice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rollDice, isRolling]);

  // Touch / pointer parallax tilt for tactile desktop experience
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRolling) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 14, y: x * 14 });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const resetStats = () => {
    if (isRolling) return;
    setHistory([currentValue]);
    setTotalRolls(0);
  };

  // Half dimension of the cube (size is 112px on mobile, 120px on desktop)
  const halfSize = 56; // 112 / 2

  return (
    <div
      className={`relative min-h-[100dvh] w-full flex flex-col justify-between items-center px-4 py-6 sm:py-8 bg-[#09090b] text-neutral-100 overflow-hidden ${className}`}
    >
      {/* Background Luxury Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central Radial Golden Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full pointer-events-none opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.05) 50%, transparent 75%)',
          }}
        />
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header / Status Bar */}
      <header className="relative z-10 w-full max-w-md flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
            <div className="w-full h-full bg-[#121215] rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-wider font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
              GURA DICE
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium tracking-tight">
              Obsidian & Gold Edition
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="w-10 h-10 rounded-xl bg-[#141418] border border-neutral-800/80 hover:border-amber-500/40 text-neutral-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-95 shadow-sm"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset Stats */}
          <button
            type="button"
            onClick={resetStats}
            title="Reset Roll History"
            disabled={isRolling}
            className="w-10 h-10 rounded-xl bg-[#141418] border border-neutral-800/80 hover:border-amber-500/40 text-neutral-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Center Stage: 3D Dice Experience */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-4 my-auto">
        {/* Dice Result Badge */}
        <div className="mb-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141418]/90 border border-amber-500/20 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-amber-300 uppercase">
              {isRolling ? 'Rolling...' : `Face Rolled: ${currentValue}`}
            </span>
          </div>
          {currentValue === 6 && !isRolling && (
            <span className="mt-1.5 text-[11px] font-semibold tracking-wider text-amber-400 flex items-center gap-1 animate-bounce">
              <Trophy className="w-3 h-3 text-amber-400" /> Critical Success!
            </span>
          )}
        </div>

        {/* 3D Perspective Stage */}
        <div
          className="relative perspective-stage w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center cursor-pointer select-none"
          onClick={rollDice}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          title="Click or tap to roll dice"
        >
          {/* Dynamic Floor Shadow beneath Dice */}
          <div
            className={`absolute bottom-4 w-28 h-8 rounded-full bg-black/85 blur-md pointer-events-none transition-all ${
              isRolling
                ? 'scale-75 opacity-25 blur-lg translate-y-3'
                : 'scale-100 opacity-80 blur-md translate-y-0'
            }`}
            style={{
              transitionDuration: isRolling ? '1100ms' : '300ms',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.95) 0%, rgba(212,175,55,0.12) 60%, transparent 80%)',
            }}
          />

          {/* Vertical Toss Arc Wrapper */}
          <div
            className="w-28 h-28 sm:w-32 sm:h-32 relative preserve-3d transition-transform"
            style={{
              transform: isRolling
                ? 'translateY(-34px) scale(1.06)'
                : `translateY(0px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transitionDuration: isRolling ? '550ms' : '200ms',
              transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {/* The 3D Rotating Cube */}
            <div
              className="w-full h-full relative preserve-3d"
              style={{
                transform: transformStyle,
                transition: isRolling
                  ? 'transform 1100ms cubic-bezier(0.18, 0.85, 0.25, 1)'
                  : 'transform 300ms ease-out',
              }}
            >
              {/* Face 1: Front */}
              <DiceFace
                number={1}
                transformStyle={`rotateY(0deg) translateZ(${halfSize}px)`}
                isFrontFacing={currentValue === 1 && !isRolling}
              />

              {/* Face 6: Back */}
              <DiceFace
                number={6}
                transformStyle={`rotateY(180deg) translateZ(${halfSize}px)`}
                isFrontFacing={currentValue === 6 && !isRolling}
              />

              {/* Face 3: Right */}
              <DiceFace
                number={3}
                transformStyle={`rotateY(90deg) translateZ(${halfSize}px)`}
                isFrontFacing={currentValue === 3 && !isRolling}
              />

              {/* Face 4: Left */}
              <DiceFace
                number={4}
                transformStyle={`rotateY(-90deg) translateZ(${halfSize}px)`}
                isFrontFacing={currentValue === 4 && !isRolling}
              />

              {/* Face 2: Top */}
              <DiceFace
                number={2}
                transformStyle={`rotateX(90deg) translateZ(${halfSize}px)`}
                isFrontFacing={currentValue === 2 && !isRolling}
              />

              {/* Face 5: Bottom */}
              <DiceFace
                number={5}
                transformStyle={`rotateX(-90deg) translateZ(${halfSize}px)`}
                isFrontFacing={currentValue === 5 && !isRolling}
              />
            </div>
          </div>
        </div>

        {/* Roll Counter & Mobile Tip */}
        <div className="mt-8 flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-neutral-400">Total Rolls:</span>
            <strong className="text-amber-300 font-mono text-sm">{totalRolls}</strong>
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-700" />
          <span className="hidden sm:inline text-neutral-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-300 font-mono text-[10px]">SPACE</kbd> or click to roll
          </span>
          <span className="sm:hidden text-neutral-400 flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-amber-400" /> Tap anywhere to roll
          </span>
        </div>
      </main>

      {/* Bottom Footer Section: Primary Action Button & Roll History */}
      <footer className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 pb-2">
        {/* Roll History Tray */}
        {history.length > 0 && (
          <div className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#121216]/80 border border-neutral-800/80 backdrop-blur-md">
            <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider mr-1">
              <History className="w-3 h-3 text-amber-500/70" />
              <span>Recent:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {history.map((val, idx) => (
                <div
                  key={`${val}-${idx}`}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-[0_0_8px_rgba(234,179,8,0.5)] scale-105'
                      : 'bg-[#18181d] border border-neutral-800 text-neutral-400'
                  }`}
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Luxury Roll Button */}
        <button
          type="button"
          onClick={rollDice}
          disabled={isRolling}
          className={`relative group w-full h-14 min-w-[220px] rounded-xl font-extrabold text-base tracking-wider uppercase transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 select-none ${
            isRolling
              ? 'bg-[#18181d] border border-amber-500/30 text-amber-300/60 cursor-not-allowed'
              : 'gold-sheen text-stone-950 gold-glow-btn cursor-pointer'
          }`}
        >
          {/* Subtle animated light shimmer across the button */}
          {!isRolling && (
            <span
              className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
              style={{ maskImage: 'linear-gradient(white, white)' }}
            >
              <span className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
            </span>
          )}

          {isRolling ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
              <span className="tracking-widest">Tumbling...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-stone-950 text-stone-950 transition-transform group-hover:rotate-12 group-hover:scale-110" />
              <span className="tracking-widest font-black">Roll Dice</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default DiceRoller;

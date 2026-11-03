/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode } from '../types/game';
import { Play, Sparkles, Shield, Wrench, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface TitleScreenProps {
  onStartGame: (mode: GameMode) => void;
  onOpenShop: () => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenShop,
  selectedMode,
  onSelectMode,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        sounds.playJump();
        onStartGame(selectedMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, selectedMode]);

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 md:p-12 pointer-events-auto bg-gradient-to-b from-black/50 via-transparent to-black/80 select-none">
      {/* Top Bar with sound toggle and Avatar Customizer */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Roblox tilted square icon */}
          <div className="w-9 h-9 bg-red-600 rounded-md rotate-[-12deg] flex items-center justify-center shadow-lg border-2 border-white/20">
            <div className="w-3.5 h-3.5 bg-white rounded-xs" />
          </div>
          <span className="text-white font-black text-xl tracking-wider drop-shadow-md">
            BLOX<span className="text-red-500">WORLD</span>
          </span>
          <span className="px-2 py-0.5 ml-2 text-xs font-bold uppercase rounded bg-red-600/80 text-white tracking-widest border border-red-400/40">
            3D Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Toggle Audio"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
            <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound On'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playBuildSnap();
              onOpenShop();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-md transition-all border border-blue-400/30 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Customize Avatar
          </button>
        </div>
      </div>

      {/* Hero Title Lockup over negative space */}
      <div className="w-full max-w-4xl mx-auto text-center my-auto flex flex-col items-center">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-4 transform hover:scale-[1.01] transition-transform">
          <svg viewBox="0 0 760 140" className="w-full max-w-[680px] h-auto drop-shadow-2xl">
            <defs>
              <linearGradient id="bloxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Blocky Extruded Shadow */}
            <text
              x="384"
              y="94"
              textAnchor="middle"
              fontFamily="Impact, system-ui, sans-serif"
              fontSize="84"
              fontWeight="900"
              fill="#000000"
              opacity="0.8"
              letterSpacing="3"
            >
              BLOXWORLD 3D
            </text>

            {/* Front Gradient Text */}
            <text
              x="380"
              y="90"
              textAnchor="middle"
              fontFamily="Impact, system-ui, sans-serif"
              fontSize="84"
              fontWeight="900"
              fill="url(#bloxGrad)"
              stroke="#0f172a"
              strokeWidth="5"
              letterSpacing="3"
            >
              BLOXWORLD <tspan fill="url(#redGrad)">3D</tspan>
            </text>
          </svg>
        </div>

        <p className="text-slate-200 text-sm md:text-base font-medium max-w-xl mb-8 drop-shadow">
          Jump into the ultimate blocky sandbox. Conquer the 10-stage Mega Obby, survive catastrophic disasters, or build anything with F3X studio tools!
        </p>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-8">
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onSelectMode('obby');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedMode === 'obby'
                ? 'bg-blue-600/90 border-blue-400 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                : 'bg-black/60 border-white/20 hover:bg-black/80 hover:border-white/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="font-bold text-white text-sm">Mega Obby</span>
            </div>
            <p className="text-xs text-slate-300">10 intense stages, laser spinners, trampolines & trophies.</p>
          </button>

          <button
            onClick={() => {
              sounds.playBuildSnap();
              onSelectMode('disasters');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedMode === 'disasters'
                ? 'bg-red-600/90 border-red-400 shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                : 'bg-black/60 border-white/20 hover:bg-black/80 hover:border-white/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-orange-300" />
              <span className="font-bold text-white text-sm">Disaster Survival</span>
            </div>
            <p className="text-xs text-slate-300">Meteors, acid rain, rising lava & twisters. Survive to win!</p>
          </button>

          <button
            onClick={() => {
              sounds.playBuildSnap();
              onSelectMode('sandbox');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedMode === 'sandbox'
                ? 'bg-emerald-600/90 border-emerald-400 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                : 'bg-black/60 border-white/20 hover:bg-black/80 hover:border-white/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-cyan-300" />
              <span className="font-bold text-white text-sm">Builderman Sandbox</span>
            </div>
            <p className="text-xs text-slate-300">F3X building tools, studded blocks, and physics toys.</p>
          </button>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => {
            sounds.playJump();
            onStartGame(selectedMode);
          }}
          className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xl tracking-wider shadow-2xl shadow-green-500/40 border-2 border-green-300/60 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>PLAY BLOXWORLD</span>
          <span className="text-xs bg-black/30 px-2 py-0.5 rounded font-mono font-normal">ENTER</span>
        </button>
      </div>

      {/* Single Flat Control-Hint Line at Bottom */}
      <div className="w-full max-w-4xl mx-auto text-center text-xs md:text-sm text-slate-300 font-mono tracking-wide py-2 px-4 rounded-full bg-black/60 border border-white/10">
        WASD Move · Space Jump · Right-Click Drag Camera · Shift Shift-Lock · 1–6 Gears · / Chat
      </div>
    </div>
  );
};

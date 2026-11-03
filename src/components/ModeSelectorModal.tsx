/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode } from '../types/game';
import { Compass, X, Sparkles, Shield, Wrench } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  const handleSelect = (mode: GameMode) => {
    sounds.playCheckpoint();
    onSelectMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-black text-lg tracking-wide">Teleport to Experience</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Places List */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => handleSelect('obby')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${
              currentMode === 'obby'
                ? 'bg-blue-600/90 border-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-slate-900 hover:bg-slate-800 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Mega Obby</h3>
                {currentMode === 'obby' && (
                  <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    Current Place
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                10 progressive stages: stud stepping stones, laser spinners, rainbow tiles, and moon gravity!
              </p>
            </div>
          </button>

          <button
            onClick={() => handleSelect('disasters')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${
              currentMode === 'disasters'
                ? 'bg-red-600/90 border-red-400 shadow-lg shadow-red-500/30'
                : 'bg-slate-900 hover:bg-slate-800 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-2xl">
              🌋
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Survive the Natural Disasters</h3>
                {currentMode === 'disasters' && (
                  <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    Current Place
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Survive meteor showers, toxic acid drizzle, rising lava, and wandering twisters!
              </p>
            </div>
          </button>

          <button
            onClick={() => handleSelect('sandbox')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${
              currentMode === 'sandbox'
                ? 'bg-emerald-600/90 border-emerald-400 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900 hover:bg-slate-800 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl">
              🛠️
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Builderman Sandbox (F3X)</h3>
                {currentMode === 'sandbox' && (
                  <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    Current Place
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Unrestricted baseplate! Place custom studded blocks, trampolines, neon lights, and load castles.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

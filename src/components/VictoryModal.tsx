/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Play, RotateCcw } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  onReplay,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti cannons
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#facc15', '#38bdf8', '#ef4444', '#22c55e', '#ec4899'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 pointer-events-auto select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-950 border-2 border-yellow-400 rounded-3xl shadow-2xl p-6 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-400/60 flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/20 animate-bounce">
          <Trophy className="w-10 h-10 text-yellow-300" />
        </div>

        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 font-bold text-xs uppercase tracking-widest rounded-full border border-yellow-500/40 mb-2">
          Mega Obby Conquered!
        </span>

        <h2 className="text-white font-black text-2xl tracking-wide mb-2">
          YOU WON THE OBBY!
        </h2>

        <p className="text-slate-300 text-sm mb-6 max-w-sm">
          Congratulations! You cleared all 10 stages, dodged deadly spinners, conquered the tightrope, and reached the Winner's Cloud Paradise!
        </p>

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl w-full mb-6 flex items-center justify-center gap-3">
          <span className="text-2xl">🪙</span>
          <div className="text-left">
            <div className="text-xs text-yellow-300/80 font-bold">Reward Claimed</div>
            <div className="text-white font-bold text-sm">+250 Blox Coins Awarded!</div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Keep Exploring
          </button>

          <button
            onClick={() => {
              sounds.playJump();
              onReplay();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/20 text-slate-200 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

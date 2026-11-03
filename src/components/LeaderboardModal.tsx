/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { Users, X } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  // Listen for Tab key toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-3 md:right-4 z-40 w-80 sm:w-96 pointer-events-auto bg-slate-950/95 border-2 border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Server Players ({entries.length})</span>
          <span className="text-[10px] text-slate-400 font-mono">[Tab]</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Table Headings */}
      <div className="grid grid-cols-12 px-4 py-1.5 bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">
        <div className="col-span-5">Player</div>
        <div className="col-span-2 text-center">Stage</div>
        <div className="col-span-3 text-center">Coins</div>
        <div className="col-span-2 text-right">Ping</div>
      </div>

      {/* Player Rows */}
      <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
        {entries.map((p) => (
          <div
            key={p.id}
            className={`grid grid-cols-12 px-4 py-2 text-xs items-center font-medium ${
              p.isPlayer ? 'bg-blue-600/20 text-white font-bold' : 'text-slate-200 hover:bg-white/5'
            }`}
          >
            <div className="col-span-5 flex items-center gap-1.5 truncate">
              {p.isPlayer && <span className="text-cyan-400 text-[10px]">●</span>}
              <span className="text-[10px] font-bold text-amber-400">{p.role}</span>
              <span className="truncate">{p.name}</span>
            </div>

            <div className="col-span-2 text-center font-mono tabular-nums text-slate-300">
              {p.stage}
            </div>

            <div className="col-span-3 text-center font-mono tabular-nums text-yellow-300">
              🪙 {p.coins}
            </div>

            <div className="col-span-2 text-right font-mono tabular-nums text-slate-400 text-[11px]">
              {p.ping}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

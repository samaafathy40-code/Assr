/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Hammer, Trash2, Box, Circle, Sparkles, Home, Shield, RotateCcw } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface SandboxToolbarProps {
  activeShape: 'box' | 'cylinder' | 'trampoline' | 'neon';
  activeColor: string;
  activeMaterial: 'plastic' | 'studs' | 'neon' | 'wood' | 'metal' | 'glass';
  onSelectShape: (shape: 'box' | 'cylinder' | 'trampoline' | 'neon') => void;
  onSelectColor: (color: string) => void;
  onSelectMaterial: (mat: 'plastic' | 'studs' | 'neon' | 'wood' | 'metal' | 'glass') => void;
  onClearAll: () => void;
  onLoadPreset: (preset: 'obby_playground' | 'castle' | 'blox_house') => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#eab308', // yellow
  '#22c55e', // green
  '#ec4899', // pink
  '#a855f7', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ffffff', // white
  '#1e293b', // dark
];

export const SandboxToolbar: React.FC<SandboxToolbarProps> = ({
  activeShape,
  activeColor,
  activeMaterial,
  onSelectShape,
  onSelectColor,
  onSelectMaterial,
  onClearAll,
  onLoadPreset,
}) => {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-950/95 border-2 border-white/20 rounded-2xl p-2.5 shadow-2xl flex flex-wrap items-center gap-3 select-none max-w-[95vw]">
      {/* Tool Label */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/30 border border-blue-400/40 rounded-xl text-xs font-bold text-cyan-300">
        <Hammer className="w-3.5 h-3.5" />
        <span>F3X</span>
      </div>

      {/* Shapes */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-2">
        <button
          onClick={() => {
            sounds.playBuildSnap();
            onSelectShape('box');
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeShape === 'box' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
          title="Cube Block"
        >
          🧱 Box
        </button>

        <button
          onClick={() => {
            sounds.playBuildSnap();
            onSelectShape('cylinder');
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeShape === 'cylinder' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
          title="Cylinder Pillar"
        >
          ⚪ Cyl
        </button>

        <button
          onClick={() => {
            sounds.playBuildSnap();
            onSelectShape('trampoline');
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeShape === 'trampoline' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
          title="Jump Trampoline"
        >
          🚀 Bounce
        </button>

        <button
          onClick={() => {
            sounds.playBuildSnap();
            onSelectShape('neon');
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeShape === 'neon' ? 'bg-amber-500 text-black shadow font-black' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
          title="Glowing Neon Block"
        >
          💡 Neon
        </button>
      </div>

      {/* Materials */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-2">
        {(['studs', 'plastic', 'wood', 'metal', 'glass'] as const).map((mat) => (
          <button
            key={mat}
            onClick={() => {
              sounds.playBuildSnap();
              onSelectMaterial(mat);
            }}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize cursor-pointer ${
              activeMaterial === mat
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {mat}
          </button>
        ))}
      </div>

      {/* Color Palette */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-2">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              sounds.playBuildSnap();
              onSelectColor(color);
            }}
            className={`w-6 h-6 rounded-md border-2 transition-transform cursor-pointer ${
              activeColor === color ? 'border-white scale-110 shadow' : 'border-black/40 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Presets */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            sounds.playCheckpoint();
            onLoadPreset('obby_playground');
          }}
          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg border border-white/10 cursor-pointer"
          title="Load Obby Playground"
        >
          🎡 Obby
        </button>
        <button
          onClick={() => {
            sounds.playCheckpoint();
            onLoadPreset('castle');
          }}
          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg border border-white/10 cursor-pointer"
          title="Load Castle Fortress"
        >
          🏰 Castle
        </button>
        <button
          onClick={() => {
            sounds.playCheckpoint();
            onLoadPreset('blox_house');
          }}
          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg border border-white/10 cursor-pointer"
          title="Load Blox House"
        >
          🏡 House
        </button>

        <button
          onClick={() => {
            sounds.playOof();
            onClearAll();
          }}
          className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg border border-red-500/30 cursor-pointer ml-1"
          title="Clear Placed Blocks"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

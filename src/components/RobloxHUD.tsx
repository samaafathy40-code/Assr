/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, GearType } from '../types/game';
import { DisasterState } from '../types/game';
import {
  Menu,
  MessageSquare,
  Users,
  Sparkles,
  Compass,
  Volume2,
  VolumeX,
  Swords,
  Zap,
  RotateCcw,
  Hammer,
  Crosshair,
  CircleDot,
} from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface RobloxHUDProps {
  health: number;
  maxHealth: number;
  coins: number;
  stage: number;
  stageName: string;
  currentMode: GameMode;
  activeGear: GearType;
  isShiftLocked: boolean;
  disasterState: DisasterState;
  showPerfStats?: boolean;
  onSelectGear: (gear: GearType) => void;
  onToggleShiftLock: () => void;
  onOpenMenu: () => void;
  onToggleChat: () => void;
  onToggleLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenModeSelector: () => void;
  onEmote: (emote: 'dance' | 'wave' | 'cheer') => void;
}

const GEAR_ITEMS: { id: GearType; label: string; icon: string; key: string }[] = [
  { id: 'sword', label: 'Sword', icon: '⚔️', key: '1' },
  { id: 'gravity_coil', label: 'Grav Coil', icon: '🌀', key: '2' },
  { id: 'speed_coil', label: 'Speed Coil', icon: '⚡', key: '3' },
  { id: 'slingshot', label: 'Slingshot', icon: '🎯', key: '4' },
  { id: 'bloxy_cola', label: 'Bloxy Cola', icon: '🥤', key: '5' },
  { id: 'build_tool', label: 'F3X Tool', icon: '🔨', key: '6' },
];

export const RobloxHUD: React.FC<RobloxHUDProps> = ({
  health,
  maxHealth,
  coins,
  stage,
  stageName,
  currentMode,
  activeGear,
  isShiftLocked,
  disasterState,
  showPerfStats = false,
  onSelectGear,
  onToggleShiftLock,
  onOpenMenu,
  onToggleChat,
  onToggleLeaderboard,
  onOpenShop,
  onOpenModeSelector,
  onEmote,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-4 z-20">
      {/* Optional Performance Stats Overlay (Roblox Ctrl+F7 style) */}
      {showPerfStats && (
        <div className="absolute top-1 right-3 pointer-events-none text-[10px] font-mono text-white/70 bg-black/50 px-2 py-0.5 rounded border border-white/10 flex items-center gap-2">
          <span>60.0 FPS</span>
          <span>·</span>
          <span>18 ms Ping</span>
          <span>·</span>
          <span>142 MB Mem</span>
        </div>
      )}
      {/* 1. TOP BAR */}
      <div className="w-full flex items-start justify-between gap-2">
        {/* Top Left: Logo / Menu, Chat toggle, Shift-Lock indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Classic Roblox Logo Menu Button */}
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onOpenMenu();
            }}
            className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 border-2 border-white/20 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95 group"
            title="Menu & Settings (Esc)"
          >
            <div className="w-5 h-5 bg-red-600 rounded-sm rotate-[-12deg] flex items-center justify-center group-hover:rotate-0 transition-transform">
              <div className="w-2 h-2 bg-white rounded-xs" />
            </div>
          </button>

          {/* Chat Toggle Button */}
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onToggleChat();
            }}
            className="h-10 px-3 bg-slate-900/90 hover:bg-slate-800 border-2 border-white/20 rounded-xl flex items-center gap-2 shadow-lg text-white font-bold text-xs"
            title="Toggle Chat (/)"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Shift Lock Indicator */}
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onToggleShiftLock();
            }}
            className={`h-10 px-3 border-2 rounded-xl flex items-center gap-1.5 shadow-lg font-bold text-xs transition-colors ${
              isShiftLocked
                ? 'bg-blue-600/90 border-blue-400 text-white'
                : 'bg-slate-900/90 border-white/20 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Shift-Lock (Shift)"
          >
            <Crosshair className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Shift Lock:</span>
            <span className={isShiftLocked ? 'text-white' : 'text-slate-400'}>
              {isShiftLocked ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Center: Stage / Disaster Status Cluster */}
        <div className="pointer-events-auto flex flex-col items-center">
          {currentMode === 'obby' && (
            <div className="px-4 py-1.5 bg-slate-900/90 border-2 border-white/20 rounded-full shadow-xl flex items-center gap-2 text-white text-xs md:text-sm font-bold">
              <span className="text-yellow-400">🏆</span>
              <span className="tabular-nums">Stage {stage} / 10</span>
              <span className="text-slate-400 hidden sm:inline">·</span>
              <span className="text-slate-300 hidden sm:inline">{stageName}</span>
            </div>
          )}

          {currentMode === 'disasters' && (
            <div className="px-4 py-1.5 bg-red-950/90 border-2 border-red-500/60 rounded-full shadow-xl flex items-center gap-2 text-white text-xs md:text-sm font-bold animate-pulse">
              <span>⚠️</span>
              <span className="text-red-300">{disasterState.name}</span>
              <span className="text-white/60">·</span>
              <span className="tabular-nums font-mono text-yellow-300">
                {disasterState.state === 'active'
                  ? `${Math.max(0, Math.ceil(disasterState.durationTimeLeft))}s`
                  : `Next in ${Math.max(0, Math.ceil(disasterState.warningTimeLeft))}s`}
              </span>
            </div>
          )}

          {currentMode === 'sandbox' && (
            <div className="px-4 py-1.5 bg-emerald-950/90 border-2 border-emerald-500/60 rounded-full shadow-xl flex items-center gap-2 text-white text-xs md:text-sm font-bold">
              <Hammer className="w-4 h-4 text-emerald-400" />
              <span>F3X Builderman Workshop</span>
            </div>
          )}
        </div>

        {/* Top Right: Health Bar, Coins, Modals */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Health Bar Cluster */}
          <div className="h-10 px-3 bg-slate-900/90 border-2 border-white/20 rounded-xl flex items-center gap-2 shadow-lg">
            <span className="text-xs font-bold text-slate-300">HP</span>
            <div className="w-20 sm:w-28 h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  hpPercent > 50
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : hpPercent > 25
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                    : 'bg-gradient-to-r from-red-600 to-rose-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className="tabular-nums font-mono text-xs font-bold text-white">
              {Math.round(health)}
            </span>
          </div>

          {/* Blox Coins Badge */}
          <div className="h-10 px-3 bg-slate-900/90 border-2 border-yellow-500/40 rounded-xl flex items-center gap-1.5 shadow-lg text-yellow-300 font-bold text-xs">
            <span className="text-base">🪙</span>
            <span className="tabular-nums font-mono">{coins}</span>
          </div>

          {/* Teleport Mode Selector */}
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onOpenModeSelector();
            }}
            className="h-10 px-2.5 sm:px-3 bg-slate-900/90 hover:bg-slate-800 border-2 border-white/20 rounded-xl flex items-center gap-1.5 text-white shadow-lg text-xs font-semibold"
            title="Teleport to other Games / Places"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Places</span>
          </button>

          {/* Leaderboard (Tab) */}
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onToggleLeaderboard();
            }}
            className="h-10 px-2.5 sm:px-3 bg-slate-900/90 hover:bg-slate-800 border-2 border-white/20 rounded-xl flex items-center gap-1.5 text-white shadow-lg text-xs font-semibold"
            title="Leaderboard (Tab)"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Players</span>
          </button>

          {/* Avatar Customizer */}
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onOpenShop();
            }}
            className="h-10 px-2.5 sm:px-3 bg-blue-600/90 hover:bg-blue-500 border-2 border-blue-400 rounded-xl flex items-center gap-1.5 text-white shadow-lg text-xs font-bold"
            title="Avatar Customizer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="hidden md:inline">Avatar</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 border-2 border-white/20 rounded-xl flex items-center justify-center text-white shadow-lg"
            title="Mute/Unmute"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </div>

      {/* 2. CENTER SHIFT LOCK CROSSHAIR */}
      {isShiftLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-3.5 h-3.5 border-2 border-white/90 rounded-full shadow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      )}

      {/* 3. BOTTOM AREA: GEAR HOTBAR & EMOTES */}
      <div className="w-full flex items-end justify-between">
        {/* Emote Buttons (Bottom Left) */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Emotes</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                sounds.playJump();
                onEmote('dance');
              }}
              className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-white/20 rounded-lg text-xs text-white font-bold shadow active:scale-95 transition-transform"
            >
              🕺 Dance
            </button>
            <button
              onClick={() => {
                sounds.playBuildSnap();
                onEmote('wave');
              }}
              className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-white/20 rounded-lg text-xs text-white font-bold shadow active:scale-95 transition-transform"
            >
              👋 Wave
            </button>
            <button
              onClick={() => {
                sounds.playJump();
                onEmote('cheer');
              }}
              className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-white/20 rounded-lg text-xs text-white font-bold shadow active:scale-95 transition-transform"
            >
              🎉 Cheer
            </button>
          </div>
        </div>

        {/* Classic 6-Slot Roblox Gear Hotbar (Bottom Center) */}
        <div className="pointer-events-auto mx-auto pb-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/90 border-2 border-white/20 rounded-2xl shadow-2xl">
            {GEAR_ITEMS.map((item) => {
              const isEquipped = activeGear === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playBuildSnap();
                    onSelectGear(isEquipped ? 'none' : item.id);
                  }}
                  className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-blue-600/90 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-slate-900/90 border border-white/10 hover:bg-slate-800 hover:border-white/30'
                  }`}
                  title={`${item.label} (Press ${item.key})`}
                >
                  {/* Slot Number Tag */}
                  <span className="absolute top-1 left-1.5 text-[10px] font-mono font-bold text-slate-400">
                    {item.key}
                  </span>

                  {/* Icon */}
                  <span className="text-xl md:text-2xl mt-1">{item.icon}</span>

                  {/* Tiny Label */}
                  <span className="text-[9px] font-semibold text-slate-200 truncate max-w-[48px] px-0.5 leading-none mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dummy spacer to keep hotbar strictly centered */}
        <div className="w-28 hidden md:block" />
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import {
  Users,
  Settings,
  HelpCircle,
  Video,
  Camera,
  X,
  Play,
  RotateCcw,
  LogOut,
  Volume2,
  VolumeX,
  UserPlus,
  UserCheck,
  AlertTriangle,
  Check,
  Crosshair,
  Sliders,
  Shield,
  Activity,
} from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface RobloxMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCharacter: () => void;
  onLeaveGame: () => void;
  isShiftLocked: boolean;
  onToggleShiftLock: () => void;
  cameraSensitivity: number;
  onSetCameraSensitivity: (val: number) => void;
  showPerfStats: boolean;
  onTogglePerfStats: () => void;
  players: LeaderboardEntry[];
  onCaptureScreenshot: () => string | null;
}

export const RobloxMenuModal: React.FC<RobloxMenuModalProps> = ({
  isOpen,
  onClose,
  onResetCharacter,
  onLeaveGame,
  isShiftLocked,
  onToggleShiftLock,
  cameraSensitivity,
  onSetCameraSensitivity,
  showPerfStats,
  onTogglePerfStats,
  players,
  onCaptureScreenshot,
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'settings' | 'help' | 'record'>('players');
  const [muted, setMuted] = useState(sounds.getMuted());
  const [volume, setVolume] = useState<number>(muted ? 0 : 70);
  const [cameraMode, setCameraMode] = useState<'classic' | 'follow'>('classic');
  const [graphicsQuality, setGraphicsQuality] = useState<number>(8);
  const [isAutoGraphics, setIsAutoGraphics] = useState<boolean>(true);

  // Sub-dialog prompts
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);

  // Social friend state simulation
  const [friendedIds, setFriendedIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  // Record / Screenshot flash & capture preview
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [showFlash, setShowFlash] = useState<boolean>(false);

  // Handle Esc key to close or dismiss sub-modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showResetConfirm) {
          setShowResetConfirm(false);
        } else if (showLeaveConfirm) {
          setShowLeaveConfirm(false);
        } else {
          sounds.playButtonClick();
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showResetConfirm, showLeaveConfirm, onClose]);

  // Video recording timer simulation
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setMuted(next);
    setVolume(next ? 0 : 70);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (val === 0) {
      sounds.setMuted(true);
      setMuted(true);
    } else {
      sounds.setMuted(false);
      setMuted(false);
    }
  };

  const toggleFriend = (id: string) => {
    sounds.playBuildSnap();
    const next = new Set(friendedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFriendedIds(next);
  };

  const takeScreenshot = () => {
    sounds.playCameraShutter();
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    const img = onCaptureScreenshot();
    if (img) {
      setScreenshotPreview(img);
    }
  };

  const toggleRecording = () => {
    sounds.playButtonClick();
    setIsRecording(!isRecording);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 pointer-events-auto select-none animate-in fade-in duration-150">
      {/* Screen flash for screenshot */}
      {showFlash && (
        <div className="fixed inset-0 bg-white/80 z-[60] pointer-events-none transition-opacity duration-200" />
      )}

      {/* Main Roblox Escape Menu Container */}
      <div className="w-full max-w-4xl bg-[#1e2022] border border-[#3b3d40] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 1. TOP HEADER & TABS BAR */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#17191b] border-b border-[#2d2f32]">
          <div className="flex items-center gap-3">
            {/* Roblox Tilted Logo */}
            <div className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md flex items-center justify-center transition-colors">
              <div className="w-4 h-4 bg-white rounded-xs rotate-[-12deg]" />
            </div>

            {/* Navigation Tabs (Players, Settings, Help, Record) */}
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setActiveTab('players');
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'players'
                    ? 'bg-[#3b3d40] text-white shadow'
                    : 'text-[#9fa3a9] hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Players</span>
                <span className="text-xs text-white/50 bg-black/30 px-1.5 py-0.2 rounded-full">
                  {players.length}
                </span>
              </button>

              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setActiveTab('settings');
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#3b3d40] text-white shadow'
                    : 'text-[#9fa3a9] hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setActiveTab('help');
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'help'
                    ? 'bg-[#3b3d40] text-white shadow'
                    : 'text-[#9fa3a9] hover:text-white hover:bg-white/5'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </button>

              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setActiveTab('record');
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-[#3b3d40] text-white shadow'
                    : 'text-[#9fa3a9] hover:text-white hover:bg-white/5'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Record</span>
                {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
              </button>
            </nav>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              sounds.playButtonClick();
              onClose();
            }}
            className="p-1.5 text-[#9fa3a9] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. BODY CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-white min-h-[340px]">
          {/* TAB 1: PLAYERS */}
          {activeTab === 'players' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8b8e94] px-3 pb-1 border-b border-[#2d2f32]">
                <span>PLAYER NAME</span>
                <div className="flex items-center gap-12 pr-2">
                  <span>STAGE</span>
                  <span>ACTIONS</span>
                </div>
              </div>

              <div className="divide-y divide-[#2d2f32]">
                {players.map((p) => {
                  const isFriended = friendedIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#282a2d] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar blocky badge */}
                        <div className="w-10 h-10 rounded-xl bg-[#323538] border border-white/10 flex items-center justify-center font-bold text-sm text-yellow-300">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{p.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              {p.role}
                            </span>
                            {p.isPlayer && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#8b8e94] font-mono">
                            🪙 {p.coins} coins · {p.ping}ms
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="font-mono text-sm font-bold text-slate-300 w-12 text-center">
                          Stage {p.stage}
                        </span>

                        {!p.isPlayer ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFriend(p.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isFriended
                                  ? 'bg-green-600/30 text-green-300 border border-green-500/40'
                                  : 'bg-[#3b3d40] hover:bg-[#4a4d52] text-white'
                              }`}
                            >
                              {isFriended ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-green-400" />
                                  <span>Friends</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Add Friend</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 text-right text-xs text-[#8b8e94] font-medium pr-2">
                            (Yourself)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Camera Mode */}
              <div className="flex items-center justify-between p-3.5 bg-[#26282b] rounded-xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm text-white">Camera Mode</h4>
                  <p className="text-xs text-[#8b8e94]">Switch between Classic Orbit or Follow camera</p>
                </div>
                <div className="flex bg-[#191b1d] p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => {
                      sounds.playButtonClick();
                      setCameraMode('classic');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      cameraMode === 'classic' ? 'bg-[#3b3d40] text-white shadow' : 'text-[#8b8e94]'
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => {
                      sounds.playButtonClick();
                      setCameraMode('follow');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      cameraMode === 'follow' ? 'bg-[#3b3d40] text-white shadow' : 'text-[#8b8e94]'
                    }`}
                  >
                    Follow
                  </button>
                </div>
              </div>

              {/* Shift Lock Switch */}
              <div className="flex items-center justify-between p-3.5 bg-[#26282b] rounded-xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span>Shift Lock Switch</span>
                  </h4>
                  <p className="text-xs text-[#8b8e94]">
                    Locks the camera behind your avatar with a crosshair when pressing Shift
                  </p>
                </div>
                <button
                  onClick={() => {
                    sounds.playButtonClick();
                    onToggleShiftLock();
                  }}
                  className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                    isShiftLocked ? 'bg-green-600 justify-end' : 'bg-[#3b3d40] justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Camera Sensitivity Slider */}
              <div className="p-3.5 bg-[#26282b] rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Camera Sensitivity</h4>
                    <p className="text-xs text-[#8b8e94]">Adjust orbital mouse speed</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {cameraSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={cameraSensitivity}
                  onChange={(e) => onSetCameraSensitivity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#191b1d] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Master Volume Slider */}
              <div className="p-3.5 bg-[#26282b] rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSound}
                      className="p-1 rounded text-[#8b8e94] hover:text-white"
                    >
                      {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
                    </button>
                    <div>
                      <h4 className="font-bold text-sm text-white">Experience Volume</h4>
                      <p className="text-xs text-[#8b8e94]">Synthesizer sound effects</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-yellow-400">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-[#191b1d] rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>

              {/* Graphics Quality */}
              <div className="p-3.5 bg-[#26282b] rounded-xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Graphics Quality</h4>
                    <p className="text-xs text-[#8b8e94]">PBR resolution & shadows</p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playButtonClick();
                      setIsAutoGraphics(!isAutoGraphics);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                      isAutoGraphics
                        ? 'bg-blue-600/30 border-blue-400/40 text-blue-300'
                        : 'bg-[#191b1d] border-white/10 text-[#8b8e94]'
                    }`}
                  >
                    {isAutoGraphics ? 'Automatic' : 'Manual'}
                  </button>
                </div>
                {/* 10 quality bars */}
                <div className="flex items-center gap-1.5 pt-1">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const active = idx < graphicsQuality;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          sounds.playButtonClick();
                          setIsAutoGraphics(false);
                          setGraphicsQuality(idx + 1);
                        }}
                        className={`flex-1 h-3 rounded-xs transition-all cursor-pointer ${
                          active
                            ? idx > 7
                              ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                              : 'bg-blue-500'
                            : 'bg-[#191b1d]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Performance Stats Overlay Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#26282b] rounded-xl border border-white/5">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Performance Stats (FPS & Ping)</span>
                  </h4>
                  <p className="text-xs text-[#8b8e94]">Displays real-time FPS and ping in the top right</p>
                </div>
                <button
                  onClick={() => {
                    sounds.playButtonClick();
                    onTogglePerfStats();
                  }}
                  className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                    showPerfStats ? 'bg-green-600 justify-end' : 'bg-[#3b3d40] justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HELP */}
          {activeTab === 'help' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-base font-black text-white">Keyboard & Mouse Controls</h3>
                <p className="text-xs text-[#8b8e94]">Standard Roblox PC and laptop controls layout</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { action: 'Move Avatar', keys: 'W, A, S, D / Arrow Keys' },
                  { action: 'Jump', keys: 'Spacebar' },
                  { action: 'Rotate Camera', keys: 'Right-Click + Drag' },
                  { action: 'Zoom In / Out', keys: 'Mouse Scroll Wheel' },
                  { action: 'Toggle Shift-Lock', keys: 'Shift Key' },
                  { action: 'Equip Hotbar Tools', keys: '1, 2, 3, 4, 5, 6' },
                  { action: 'Use Active Tool', keys: 'Left Click' },
                  { action: 'Open Chat', keys: '/ Key' },
                  { action: 'Toggle Player List', keys: 'Tab Key' },
                  { action: 'Open Roblox Menu', keys: 'Escape (Esc)' },
                  { action: 'Dance Emote', keys: '/e dance' },
                  { action: 'Wave Emote', keys: '/e wave' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#26282b] rounded-xl border border-white/5"
                  >
                    <span className="font-semibold text-white">{item.action}</span>
                    <span className="font-mono text-[#8b8e94] bg-[#191b1d] px-2 py-1 rounded border border-white/10 text-[11px]">
                      {item.keys}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RECORD */}
          {activeTab === 'record' && (
            <div className="max-w-md mx-auto space-y-5 text-center">
              <div>
                <h3 className="text-base font-black text-white">Record & Screenshots</h3>
                <p className="text-xs text-[#8b8e94]">Capture moments in BloxWorld 3D</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Take Screenshot */}
                <button
                  onClick={takeScreenshot}
                  className="p-5 bg-[#26282b] hover:bg-[#2d3034] border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-white">Take Screenshot</span>
                  <span className="text-[11px] text-[#8b8e94]">Capture 3D frame</span>
                </button>

                {/* Record Video */}
                <button
                  onClick={toggleRecording}
                  className={`p-5 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-500/20'
                      : 'bg-[#26282b] hover:bg-[#2d3034] border-white/10'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                      isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-red-600/20 text-red-400'
                    }`}
                  >
                    <Video className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-white">
                    {isRecording ? `REC 00:${recordSeconds < 10 ? '0' : ''}${recordSeconds}` : 'Record Video'}
                  </span>
                  <span className="text-[11px] text-[#8b8e94]">
                    {isRecording ? 'Click to stop' : 'Simulate video clip'}
                  </span>
                </button>
              </div>

              {/* Screenshot Preview */}
              {screenshotPreview && (
                <div className="p-3 bg-[#26282b] rounded-2xl border border-white/10 text-left space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-[#8b8e94]">
                    <span className="font-bold text-green-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Screenshot Captured!
                    </span>
                    <a
                      href={screenshotPreview}
                      download="bloxworld-screenshot.png"
                      className="text-blue-400 hover:underline"
                    >
                      Download Image
                    </a>
                  </div>
                  <img
                    src={screenshotPreview}
                    alt="Captured Screenshot"
                    className="w-full h-36 object-cover rounded-xl border border-white/10"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. AUTHENTIC ROBLOX BOTTOM ACTION BAR (RESUME, RESET CHARACTER, LEAVE GAME) */}
        <div className="px-5 py-3.5 bg-[#17191b] border-t border-[#2d2f32] flex flex-wrap items-center justify-between gap-3">
          {/* Left Action Buttons: Reset & Leave */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                sounds.playButtonClick();
                setShowResetConfirm(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#282a2d] hover:bg-[#34373b] border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>Reset Character</span>
            </button>

            <button
              onClick={() => {
                sounds.playButtonClick();
                setShowLeaveConfirm(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#282a2d] hover:bg-[#34373b] border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#8b8e94]" />
              <span>Leave Game</span>
            </button>
          </div>

          {/* Right Action Button: Big Green Resume Game Button */}
          <button
            onClick={() => {
              sounds.playButtonClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-sm tracking-wide shadow-lg shadow-green-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Game</span>
            <span className="text-[11px] bg-black/30 px-1.5 py-0.2 rounded font-mono font-normal">
              Esc
            </span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION DIALOG: RESET CHARACTER */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-[#1e2022] border-2 border-red-500/50 rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-lg text-white">Reset Character?</h3>
              <p className="text-xs text-[#8b8e94] mt-1">
                Are you sure you want to reset your character? You will respawn at the latest checkpoint.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  sounds.playOof();
                  setShowResetConfirm(false);
                  onResetCharacter();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#282a2d] hover:bg-[#34373b] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: LEAVE GAME */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-[#1e2022] border-2 border-white/20 rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-lg text-white">Leave Experience?</h3>
              <p className="text-xs text-[#8b8e94] mt-1">
                Are you sure you want to leave? Your progress and checkpoints will be saved.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setShowLeaveConfirm(false);
                  onLeaveGame();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Leave
              </button>
              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setShowLeaveConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#282a2d] hover:bg-[#34373b] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Don't Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

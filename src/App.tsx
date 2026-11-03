/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameMode,
  GameStatus,
  AvatarCustomization,
  GearType,
  ChatMessage,
  LeaderboardEntry,
  DisasterState,
} from './types/game';
import { GameEngine } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { RobloxHUD } from './components/RobloxHUD';
import { ChatOverlay } from './components/ChatOverlay';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AvatarShopModal } from './components/AvatarShopModal';
import { ModeSelectorModal } from './components/ModeSelectorModal';
import { SandboxToolbar } from './components/SandboxToolbar';
import { RobloxMenuModal } from './components/RobloxMenuModal';
import { VictoryModal } from './components/VictoryModal';
import { BOT_CHAT_LINES } from './entities/botPlayers';
import { sounds } from './audio/soundEffects';

const INITIAL_CUSTOMIZATION: AvatarCustomization = {
  skinColor: '#facc15', // Classic Yellow
  torsoColor: '#2563eb', // Classic Blue
  leftArmColor: '#facc15',
  rightArmColor: '#facc15',
  leftLegColor: '#16a34a', // Classic Green
  rightLegColor: '#16a34a',
  hat: 'none',
  face: 'smile',
  shirtPattern: 'classic_roblox',
  backAccessory: 'none',
};

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { id: '1', sender: 'System', role: 'system', text: 'Welcome to BloxWorld 3D! Press / to chat.', timestamp: Date.now() - 20000 },
  { id: '2', sender: 'Builderman', role: 'owner', text: 'Welcome Bloxians! Hope you enjoy the Mega Obby and Disasters!', timestamp: Date.now() - 15000 },
  { id: '3', sender: 'xX_ShadowNinja_Xx', role: 'vip', text: 'just beat stage 7 tightrope!! took me 4 tries haha', timestamp: Date.now() - 8000 },
  { id: '4', sender: 'SunnyStar', role: 'vip', text: 'anyone want to dance with me? /e dance :D', timestamp: Date.now() - 3000 },
];

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game States
  const [gameStatus, setGameStatus] = useState<GameStatus>('title');
  const [currentMode, setCurrentMode] = useState<GameMode>('obby');
  const [customization, setCustomization] = useState<AvatarCustomization>(INITIAL_CUSTOMIZATION);

  // HUD & Player States
  const [health, setHealth] = useState<number>(100);
  const [maxHealth] = useState<number>(100);
  const [coins, setCoins] = useState<number>(50);
  const [stage, setStage] = useState<number>(0);
  const [stageName, setStageName] = useState<string>('Spawn Plaza');
  const [activeGear, setActiveGear] = useState<GearType>('none');
  const [isShiftLocked, setIsShiftLocked] = useState<boolean>(false);
  const [disasterState, setDisasterState] = useState<DisasterState>({
    activeDisaster: 'none',
    name: 'Intermission',
    description: 'Prepare for the next natural disaster...',
    warningTimeLeft: 10,
    durationTimeLeft: 35,
    state: 'waiting',
    lavaHeight: -5,
  });

  // Modal Visibility States
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);

  // Settings states
  const [cameraSensitivity, setCameraSensitivity] = useState<number>(1.0);
  const [showPerfStats, setShowPerfStats] = useState<boolean>(false);

  // Sandbox F3X Tool Settings
  const [sandboxShape, setSandboxShape] = useState<'box' | 'cylinder' | 'trampoline' | 'neon'>('box');
  const [sandboxColor, setSandboxColor] = useState<string>('#3b82f6');
  const [sandboxMaterial, setSandboxMaterial] = useState<'plastic' | 'studs' | 'neon' | 'wood' | 'metal' | 'glass'>('studs');

  // Chat & Social
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

  // Global Esc key listener to toggle Roblox Menu
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameStatus === 'playing') {
          if (isShopOpen) setIsShopOpen(false);
          else if (isModeSelectorOpen) setIsModeSelectorOpen(false);
          else if (isLeaderboardOpen) setIsLeaderboardOpen(false);
          else if (isChatOpen) setIsChatOpen(false);
          else {
            sounds.playButtonClick();
            setIsMenuOpen((prev) => !prev);
          }
        }
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [gameStatus, isShopOpen, isModeSelectorOpen, isLeaderboardOpen, isChatOpen]);

  // Initialize 3D Game Engine once
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new GameEngine(canvasContainerRef.current, customization, {
      onHealthChange: (hp, max) => setHealth(hp),
      onStageChange: (stg, name) => {
        setStage(stg);
        setStageName(name);
      },
      onCoinsChange: (c) => setCoins(c),
      onGearChange: (gear) => setActiveGear(gear),
      onShiftLockChange: (locked) => setIsShiftLocked(locked),
      onDisasterUpdate: (state) => setDisasterState(state),
      onVictory: () => setIsVictoryOpen(true),
      onDeath: () => {
        setHealth(0);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync avatar customization changes to 3D engine
  const handleUpdateCustomization = (newCust: AvatarCustomization) => {
    setCustomization(newCust);
    if (engineRef.current) {
      engineRef.current.updateCustomization(newCust);
    }
  };

  // Start Experience
  const handleStartGame = (mode: GameMode) => {
    setCurrentMode(mode);
    setGameStatus('playing');
    if (engineRef.current) {
      engineRef.current.switchMode(mode);
    }
  };

  // Switch Place
  const handleSwitchMode = (mode: GameMode) => {
    setCurrentMode(mode);
    if (engineRef.current) {
      engineRef.current.switchMode(mode);
    }
  };

  // Select Gear
  const handleSelectGear = (gear: GearType) => {
    setActiveGear(gear);
    if (engineRef.current) {
      engineRef.current.setGear(gear);
    }
  };

  // Toggle Shift Lock
  const handleToggleShiftLock = () => {
    if (engineRef.current) {
      engineRef.current.toggleShiftLock();
    }
  };

  // Emote Trigger
  const handleEmote = (emote: 'dance' | 'wave' | 'cheer') => {
    if (engineRef.current) {
      engineRef.current.triggerEmote(emote);
    }
    // Add emote broadcast to chat
    const actionText = emote === 'dance' ? 'is dancing!' : emote === 'wave' ? 'waves at everyone!' : 'cheers enthusiastically!';
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'You', role: 'player', text: `/e ${emote} (${actionText})`, timestamp: Date.now() },
    ]);
  };

  // Chat message sender with Bot reply logic
  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Check for slash commands
    if (trimmed.startsWith('/e ') || trimmed === '/dance' || trimmed === '/wave' || trimmed === '/cheer') {
      const emoteCmd = trimmed.replace('/e ', '').replace('/', '');
      if (['dance', 'wave', 'cheer'].includes(emoteCmd)) {
        handleEmote(emoteCmd as any);
        return;
      }
    } else if (trimmed === '/reset') {
      if (engineRef.current) {
        engineRef.current.die();
      }
      return;
    }

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      role: 'player',
      text: trimmed,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // Bot response simulation after a brief natural typing delay
    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let botSender = 'NoobMaster2006';
      let botRole: 'player' | 'vip' | 'owner' = 'player';
      let reply = '';

      if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
        botSender = 'SunnyStar';
        botRole = 'vip';
        reply = 'Hey there! Welcome to the server :D';
      } else if (lower.includes('help') || lower.includes('how')) {
        botSender = 'Builderman';
        botRole = 'owner';
        reply = 'Use WASD to move, Space to jump, and equip the coils with 2 and 3 keys!';
      } else if (lower.includes('dance')) {
        botSender = 'SunnyStar';
        botRole = 'vip';
        reply = 'yay dance party! /e dance';
        handleEmote('dance');
      } else if (lower.includes('oof')) {
        reply = 'oof indeed haha';
      } else {
        // Random chat line
        const randomLine = BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)];
        reply = randomLine;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: botSender,
          role: botRole,
          text: reply,
          timestamp: Date.now(),
        },
      ]);
    }, 900);
  };

  // Periodic simulated server chat banter
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.4) {
        const bots = ['Builderman', 'xX_ShadowNinja_Xx', 'SunnyStar', 'ProSpeedRunner', 'NoobMaster2006'];
        const randomBot = bots[Math.floor(Math.random() * bots.length)];
        const randomRole = randomBot === 'Builderman' ? 'owner' : randomBot.includes('Ninja') || randomBot === 'SunnyStar' ? 'vip' : 'player';
        const randomLine = BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)];

        setChatMessages((prev) => [
          ...prev.slice(-25), // keep last 25
          {
            id: Date.now().toString(),
            sender: randomBot,
            role: randomRole as any,
            text: randomLine,
            timestamp: Date.now(),
          },
        ]);
      }
    }, 14000);

    return () => clearInterval(interval);
  }, []);

  // Update sandbox block properties
  const handleSelectSandboxShape = (shape: 'box' | 'cylinder' | 'trampoline' | 'neon') => {
    setSandboxShape(shape);
    if (engineRef.current) engineRef.current.buildShape = shape;
  };

  const handleSelectSandboxColor = (color: string) => {
    setSandboxColor(color);
    if (engineRef.current) engineRef.current.buildColor = color;
  };

  const handleSelectSandboxMaterial = (mat: 'plastic' | 'studs' | 'neon' | 'wood' | 'metal' | 'glass') => {
    setSandboxMaterial(mat);
    if (engineRef.current) engineRef.current.buildMaterial = mat;
  };

  // Compile leaderboard entries combining player + bot entities
  const leaderboardEntries: LeaderboardEntry[] = [
    {
      id: 'player_me',
      name: 'You (Player)',
      isPlayer: true,
      role: '[YOU]',
      stage,
      survivalWins: currentMode === 'disasters' ? 3 : 1,
      coins,
      ping: 18,
    },
    ...(engineRef.current?.bots.map((b) => b.toLeaderboard()) || []),
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. ISOLATED 3D WEBGL CANVAS MOUNT */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* 2. TITLE SCREEN (When game status is 'title') */}
      {gameStatus === 'title' && (
        <TitleScreen
          selectedMode={currentMode}
          onSelectMode={(m) => {
            setCurrentMode(m);
            if (engineRef.current) engineRef.current.switchMode(m);
          }}
          onStartGame={handleStartGame}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* 3. IN-GAME LOW-OCCLUSION HUD */}
      {gameStatus === 'playing' && (
        <RobloxHUD
          health={health}
          maxHealth={maxHealth}
          coins={coins}
          stage={stage}
          stageName={stageName}
          currentMode={currentMode}
          activeGear={activeGear}
          isShiftLocked={isShiftLocked}
          disasterState={disasterState}
          showPerfStats={showPerfStats}
          onSelectGear={handleSelectGear}
          onToggleShiftLock={handleToggleShiftLock}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onToggleLeaderboard={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenModeSelector={() => setIsModeSelectorOpen(true)}
          onEmote={handleEmote}
        />
      )}

      {/* 4. SANDBOX F3X TOOLBAR (Visible when Build Tool is active in Hotbar) */}
      {gameStatus === 'playing' && activeGear === 'build_tool' && (
        <SandboxToolbar
          activeShape={sandboxShape}
          activeColor={sandboxColor}
          activeMaterial={sandboxMaterial}
          onSelectShape={handleSelectSandboxShape}
          onSelectColor={handleSelectSandboxColor}
          onSelectMaterial={handleSelectSandboxMaterial}
          onClearAll={() => engineRef.current?.sandboxWorld.clearAll()}
          onLoadPreset={(p) => engineRef.current?.sandboxWorld.loadSampleBuild(p)}
        />
      )}

      {/* 5. OVERLAYS & MODALS */}
      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendMessage}
        messages={chatMessages}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboardEntries}
      />

      <AvatarShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        customization={customization}
        onUpdateCustomization={handleUpdateCustomization}
      />

      <ModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        currentMode={currentMode}
        onSelectMode={handleSwitchMode}
      />

      <RobloxMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onResetCharacter={() => engineRef.current?.die()}
        onLeaveGame={() => {
          setIsMenuOpen(false);
          setGameStatus('title');
        }}
        isShiftLocked={isShiftLocked}
        onToggleShiftLock={handleToggleShiftLock}
        cameraSensitivity={cameraSensitivity}
        onSetCameraSensitivity={(val) => {
          setCameraSensitivity(val);
          if (engineRef.current) engineRef.current.cameraSensitivity = val;
        }}
        showPerfStats={showPerfStats}
        onTogglePerfStats={() => setShowPerfStats((p) => !p)}
        players={leaderboardEntries}
        onCaptureScreenshot={() => engineRef.current ? engineRef.current.captureScreenshot() : null}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        onReplay={() => {
          setIsVictoryOpen(false);
          if (engineRef.current) {
            engineRef.current.respawnPos.set(0, 2, 15);
            engineRef.current.respawnPlayer();
          }
        }}
      />
    </div>
  );
}

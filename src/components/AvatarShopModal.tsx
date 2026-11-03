/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AvatarCustomization } from '../types/game';
import { Sparkles, X, Check, Shirt, Smile, Shield, Palette } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface AvatarShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: AvatarCustomization;
  onUpdateCustomization: (c: AvatarCustomization) => void;
}

const PRESETS: { name: string; icon: string; config: AvatarCustomization }[] = [
  {
    name: 'The Classic Noob',
    icon: '🟡',
    config: {
      skinColor: '#facc15',
      torsoColor: '#2563eb',
      leftArmColor: '#facc15',
      rightArmColor: '#facc15',
      leftLegColor: '#16a34a',
      rightLegColor: '#16a34a',
      hat: 'none',
      face: 'smile',
      shirtPattern: 'solid',
      backAccessory: 'none',
    },
  },
  {
    name: 'Builderman',
    icon: '👷',
    config: {
      skinColor: '#fcd34d',
      torsoColor: '#ff6b00',
      leftArmColor: '#fcd34d',
      rightArmColor: '#fcd34d',
      leftLegColor: '#1e3a8a',
      rightLegColor: '#1e3a8a',
      hat: 'hard_hat',
      face: 'smile',
      shirtPattern: 'builder_vest',
      backAccessory: 'none',
    },
  },
  {
    name: 'Guest 1337',
    icon: '🗡️',
    config: {
      skinColor: '#fde047',
      torsoColor: '#111827',
      leftArmColor: '#111827',
      rightArmColor: '#111827',
      leftLegColor: '#1f2937',
      rightLegColor: '#1f2937',
      hat: 'none',
      face: 'epic',
      shirtPattern: 'classic_roblox',
      backAccessory: 'sword_sheath',
    },
  },
  {
    name: 'Dominus Cyber',
    icon: '👑',
    config: {
      skinColor: '#e2e8f0',
      torsoColor: '#0f172a',
      leftArmColor: '#0f172a',
      rightArmColor: '#0f172a',
      leftLegColor: '#0f172a',
      rightLegColor: '#0f172a',
      hat: 'dominus',
      face: 'epic',
      shirtPattern: 'cyber_neon',
      backAccessory: 'wings',
    },
  },
  {
    name: 'Cool Guy DJ',
    icon: '🎧',
    config: {
      skinColor: '#fed7aa',
      torsoColor: '#ec4899',
      leftArmColor: '#fed7aa',
      rightArmColor: '#fed7aa',
      leftLegColor: '#8b5cf6',
      rightLegColor: '#8b5cf6',
      hat: 'headphones',
      face: 'sunglasses',
      shirtPattern: 'stripes',
      backAccessory: 'cape',
    },
  },
];

const HATS: { id: AvatarCustomization['hat']; label: string; icon: string }[] = [
  { id: 'none', label: 'No Hat', icon: '👤' },
  { id: 'hard_hat', label: 'Builder Helmet', icon: '👷' },
  { id: 'party_hat', label: 'Party Hat', icon: '🎉' },
  { id: 'dominus', label: 'Dominus Aureus', icon: '👑' },
  { id: 'valkyrie', label: 'Valkyrie Helm', icon: '🪖' },
  { id: 'headphones', label: 'DJ Headphones', icon: '🎧' },
  { id: 'horns', label: 'Demon Horns', icon: '😈' },
  { id: 'halo', label: 'Angel Halo', icon: '😇' },
];

const FACES: { id: AvatarCustomization['face']; label: string; icon: string }[] = [
  { id: 'smile', label: 'Classic Smile', icon: '🙂' },
  { id: 'epic', label: 'Epic Face', icon: '😏' },
  { id: 'chill', label: 'Chill Face', icon: '😌' },
  { id: 'sunglasses', label: 'Aviators', icon: '😎' },
  { id: 'derp', label: 'Derp Tongue', icon: '🤪' },
];

const SHIRTS: { id: AvatarCustomization['shirtPattern']; label: string }[] = [
  { id: 'classic_roblox', label: 'Classic Red R' },
  { id: 'builder_vest', label: 'Builder Safety Vest' },
  { id: 'cyber_neon', label: 'Cyber Reactor' },
  { id: 'tuxedo', label: 'Formal Tuxedo' },
  { id: 'stripes', label: 'Casual Striped' },
  { id: 'solid', label: 'Solid Color' },
];

const BACK_ITEMS: { id: AvatarCustomization['backAccessory']; label: string; icon: string }[] = [
  { id: 'none', label: 'None', icon: '✖️' },
  { id: 'sword_sheath', label: 'Katana Sheath', icon: '🗡️' },
  { id: 'wings', label: 'Neon Wings', icon: '🪽' },
  { id: 'cape', label: 'Hero Cape', icon: '🦸' },
];

const COLOR_SWATCHES = [
  '#facc15', // yellow
  '#2563eb', // blue
  '#16a34a', // green
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ffffff', // white
  '#111827', // dark
];

export const AvatarShopModal: React.FC<AvatarShopModalProps> = ({
  isOpen,
  onClose,
  customization,
  onUpdateCustomization,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'hats' | 'faces' | 'shirts' | 'colors'>('presets');

  if (!isOpen) return null;

  const update = (patch: Partial<AvatarCustomization>) => {
    sounds.playBuildSnap();
    onUpdateCustomization({ ...customization, ...patch });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-950 border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h2 className="text-white font-black text-lg tracking-wide">Avatar Shop & Wardrobe</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 bg-slate-900/60 border-b border-white/10 gap-2 overflow-x-auto">
          {[
            { id: 'presets', label: 'Presets', icon: '🌟' },
            { id: 'hats', label: 'Hats & Gear', icon: '🎩' },
            { id: 'faces', label: 'Faces', icon: '🙂' },
            { id: 'shirts', label: 'Shirts', icon: '👕' },
            { id: 'colors', label: 'Body Colors', icon: '🎨' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playBuildSnap();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-t-2 border-x-2 border-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    sounds.playCheckpoint();
                    onUpdateCustomization(preset.config);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-white/10 hover:border-blue-400 text-left transition-all flex items-center gap-3 group cursor-pointer"
                >
                  <span className="text-3xl">{preset.icon}</span>
                  <div>
                    <h3 className="text-white font-bold text-sm group-hover:text-blue-400">
                      {preset.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">Instant classic fit</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'hats' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hats</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {HATS.map((hat) => (
                    <button
                      key={hat.id}
                      onClick={() => update({ hat: hat.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        customization.hat === hat.id
                          ? 'bg-blue-600/90 border-blue-400 shadow-md text-white font-bold'
                          : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{hat.icon}</div>
                      <div className="text-xs font-medium truncate">{hat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Back Accessories</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BACK_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => update({ backAccessory: item.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        customization.backAccessory === item.id
                          ? 'bg-blue-600/90 border-blue-400 shadow-md text-white font-bold'
                          : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-xs font-medium truncate">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faces' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FACES.map((face) => (
                <button
                  key={face.id}
                  onClick={() => update({ face: face.id })}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    customization.face === face.id
                      ? 'bg-blue-600/90 border-blue-400 text-white font-bold shadow-md'
                      : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{face.icon}</div>
                  <div className="text-xs font-medium">{face.label}</div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'shirts' && (
            <div className="grid grid-cols-2 gap-3">
              {SHIRTS.map((shirt) => (
                <button
                  key={shirt.id}
                  onClick={() => update({ shirtPattern: shirt.id })}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    customization.shirtPattern === shirt.id
                      ? 'bg-blue-600/90 border-blue-400 text-white font-bold'
                      : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold mb-1">{shirt.label}</div>
                  <div className="text-[11px] text-slate-400">Torso decal pattern</div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skin / Head Color</h4>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => update({ skinColor: color, leftArmColor: color, rightArmColor: color })}
                      className="w-9 h-9 rounded-xl border-2 border-white/30 shadow transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Torso Shirt Color</h4>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => update({ torsoColor: color })}
                      className="w-9 h-9 rounded-xl border-2 border-white/30 shadow transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pants / Legs Color</h4>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => update({ leftLegColor: color, rightLegColor: color })}
                      className="w-9 h-9 rounded-xl border-2 border-white/30 shadow transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              sounds.playBuildSnap();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};

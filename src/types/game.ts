/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'obby' | 'disasters' | 'sandbox';

export type GameStatus = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface AvatarCustomization {
  skinColor: string;
  torsoColor: string;
  leftArmColor: string;
  rightArmColor: string;
  leftLegColor: string;
  rightLegColor: string;
  hat: 'none' | 'hard_hat' | 'party_hat' | 'dominus' | 'valkyrie' | 'headphones' | 'horns' | 'halo';
  face: 'smile' | 'epic' | 'chill' | 'sunglasses' | 'derp';
  shirtPattern: 'classic_roblox' | 'stripes' | 'tuxedo' | 'cyber_neon' | 'builder_vest' | 'solid';
  backAccessory: 'none' | 'sword_sheath' | 'wings' | 'cape';
}

export type GearType = 
  | 'none'
  | 'sword'
  | 'gravity_coil'
  | 'speed_coil'
  | 'slingshot'
  | 'bloxy_cola'
  | 'build_tool';

export interface HotbarSlot {
  id: GearType;
  name: string;
  icon: string;
  description: string;
  ammo?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'owner' | 'vip' | 'player' | 'system';
  text: string;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  isPlayer: boolean;
  role: string;
  stage: number;
  survivalWins: number;
  coins: number;
  ping: number;
}

export type DisasterType = 'none' | 'meteor_shower' | 'acid_rain' | 'rising_lava' | 'tornado';

export interface DisasterState {
  activeDisaster: DisasterType;
  name: string;
  description: string;
  warningTimeLeft: number;
  durationTimeLeft: number;
  state: 'waiting' | 'warning' | 'active' | 'cleared';
  lavaHeight: number;
}

export interface PlacedBlock {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  shape: 'box' | 'wedge' | 'cylinder' | 'trampoline' | 'conveyor' | 'neon';
  color: string;
  materialType: 'plastic' | 'studs' | 'neon' | 'wood' | 'metal' | 'glass';
  isSolid: boolean;
}

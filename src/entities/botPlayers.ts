/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RobloxAvatar } from './avatar';
import { AvatarCustomization, ChatMessage, LeaderboardEntry } from '../types/game';

export interface BotPlayerConfig {
  id: string;
  name: string;
  role: 'owner' | 'vip' | 'player' | 'system';
  roleTag: string;
  customization: AvatarCustomization;
  homePos: THREE.Vector3;
}

export const BOT_CONFIGS: BotPlayerConfig[] = [
  {
    id: 'bot_builderman',
    name: 'Builderman',
    role: 'owner',
    roleTag: '[ADMIN]',
    customization: {
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
    homePos: new THREE.Vector3(-6, 0, 10),
  },
  {
    id: 'bot_ninja',
    name: 'xX_ShadowNinja_Xx',
    role: 'vip',
    roleTag: '[VIP]',
    customization: {
      skinColor: '#e2e8f0',
      torsoColor: '#0f172a',
      leftArmColor: '#0f172a',
      rightArmColor: '#0f172a',
      leftLegColor: '#0f172a',
      rightLegColor: '#0f172a',
      hat: 'dominus',
      face: 'epic',
      shirtPattern: 'cyber_neon',
      backAccessory: 'sword_sheath',
    },
    homePos: new THREE.Vector3(6, 0, 12),
  },
  {
    id: 'bot_noob',
    name: 'NoobMaster2006',
    role: 'player',
    roleTag: '[ROOKIE]',
    customization: {
      skinColor: '#facc15', // Classic Yellow
      torsoColor: '#2563eb', // Classic Royal Blue
      leftArmColor: '#facc15',
      rightArmColor: '#facc15',
      leftLegColor: '#16a34a', // Classic Lime Green
      rightLegColor: '#16a34a',
      hat: 'none',
      face: 'smile',
      shirtPattern: 'solid',
      backAccessory: 'none',
    },
    homePos: new THREE.Vector3(0, 0, 8),
  },
  {
    id: 'bot_sunny',
    name: 'SunnyStar',
    role: 'vip',
    roleTag: '[VIP]',
    customization: {
      skinColor: '#fed7aa',
      torsoColor: '#ec4899',
      leftArmColor: '#fed7aa',
      rightArmColor: '#fed7aa',
      leftLegColor: '#8b5cf6',
      rightLegColor: '#8b5cf6',
      hat: 'headphones',
      face: 'chill',
      shirtPattern: 'stripes',
      backAccessory: 'wings',
    },
    homePos: new THREE.Vector3(-10, 0, 18),
  },
  {
    id: 'bot_pro',
    name: 'ProSpeedRunner',
    role: 'player',
    roleTag: '[PRO]',
    customization: {
      skinColor: '#fde047',
      torsoColor: '#dc2626',
      leftArmColor: '#dc2626',
      rightArmColor: '#dc2626',
      leftLegColor: '#1e293b',
      rightLegColor: '#1e293b',
      hat: 'valkyrie',
      face: 'sunglasses',
      shirtPattern: 'classic_roblox',
      backAccessory: 'cape',
    },
    homePos: new THREE.Vector3(10, 0, 20),
  },
];

export class BotPlayer {
  public config: BotPlayerConfig;
  public avatar: RobloxAvatar;
  public pos: THREE.Vector3;
  public targetPos: THREE.Vector3;
  public moveTimer: number = 0;
  public isJumping: boolean = false;
  public jumpVelY: number = 0;
  public currentStage: number = 0;
  public survivalWins: number = 2;
  public coins: number = 150;

  constructor(config: BotPlayerConfig) {
    this.config = config;
    this.pos = config.homePos.clone();
    this.targetPos = config.homePos.clone();
    this.avatar = new RobloxAvatar(config.customization);
    this.avatar.root.position.copy(this.pos);
    this.currentStage = Math.floor(Math.random() * 5);
    this.coins = 100 + Math.floor(Math.random() * 400);
    this.survivalWins = Math.floor(Math.random() * 8);
  }

  public update(dt: number, obbyCheckpoints?: { stage: number; pos: THREE.Vector3 }[]) {
    this.moveTimer -= dt;

    if (this.moveTimer <= 0) {
      this.moveTimer = 2.0 + Math.random() * 4.0;

      // Pick new wander target or jump
      const shouldJump = Math.random() < 0.35 && !this.isJumping;
      if (shouldJump) {
        this.isJumping = true;
        this.jumpVelY = 14;
      }

      // Random wander around home or obby checkpoint
      let center = this.config.homePos;
      if (obbyCheckpoints && obbyCheckpoints.length > 0 && Math.random() < 0.5) {
        const cp = obbyCheckpoints[Math.min(this.currentStage, obbyCheckpoints.length - 1)];
        if (cp) center = cp.pos;
      }

      this.targetPos.set(
        center.x + (Math.random() - 0.5) * 12,
        center.y,
        center.z + (Math.random() - 0.5) * 12
      );

      // Random emote
      if (Math.random() < 0.2) {
        const emotes: ('dance' | 'wave' | 'cheer' | 'idle')[] = ['dance', 'wave', 'cheer', 'idle'];
        this.avatar.currentAnim = emotes[Math.floor(Math.random() * emotes.length)];
      }
    }

    // Move toward target
    const dist = this.pos.distanceTo(this.targetPos);
    if (dist > 0.4 && !this.avatar.isActionActive && this.avatar.currentAnim !== 'dance') {
      this.avatar.isMoving = true;
      const dir = this.targetPos.clone().sub(this.pos).normalize();
      this.pos.x += dir.x * 5 * dt;
      this.pos.z += dir.z * 5 * dt;

      // Rotate avatar towards movement direction
      const angle = Math.atan2(dir.x, dir.z);
      this.avatar.root.rotation.y = THREE.MathUtils.damp(this.avatar.root.rotation.y, angle, 10, dt);
    } else {
      this.avatar.isMoving = false;
    }

    // Handle jumping
    if (this.isJumping) {
      this.pos.y += this.jumpVelY * dt;
      this.jumpVelY -= 32 * dt;
      this.avatar.isGrounded = false;
      if (this.pos.y <= this.targetPos.y) {
        this.pos.y = this.targetPos.y;
        this.isJumping = false;
        this.avatar.isGrounded = true;
      }
    } else {
      this.avatar.isGrounded = true;
    }

    this.avatar.root.position.copy(this.pos);
    this.avatar.update(dt);
  }

  public toLeaderboard(): LeaderboardEntry {
    return {
      id: this.config.id,
      name: this.config.name,
      isPlayer: false,
      role: this.config.roleTag,
      stage: this.currentStage,
      survivalWins: this.survivalWins,
      coins: this.coins,
      ping: 28 + Math.floor(Math.random() * 40),
    };
  }
}

// Bot Chat Generator
export const BOT_CHAT_LINES = [
  "oof stage 3 disappearing blocks got me haha",
  "anyone know how to get the golden trophy?",
  "press Shift for shift-lock camera!! so much easier",
  "gg nice jump!!",
  "watch out for the red spinner on stage 2!",
  "meteor incoming!! run to the tower!!",
  "nice avatar fit!",
  "type /e dance to dance with me :D",
  "bloxy cola heals full hp guys",
  "speed coil makes you fly across stage 4",
  "who's building that cool castle in sandbox?",
  "oof!",
  "let's gooooo!!",
  "wait for me at the checkpoint!!",
];

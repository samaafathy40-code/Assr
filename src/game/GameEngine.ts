/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { AvatarCustomization, DisasterType, GameMode, GearType, PlacedBlock } from '../types/game';
import { RobloxAvatar } from '../entities/avatar';
import { SkyAndLighting, isSoftwareGl } from '../world/skyAndLighting';
import { ObbyWorld, ObbyPlatform } from '../world/obbyWorld';
import { DisasterWorld } from '../world/disasterWorld';
import { SandboxWorld } from '../world/sandboxWorld';
import { BotPlayer, BOT_CONFIGS } from '../entities/botPlayers';
import { sounds } from '../audio/soundEffects';

// Pre-allocated math objects for zero garbage collection in render loop
const _vec1 = new THREE.Vector3();
const _vec2 = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _playerBox = new THREE.Box3();

export interface EngineCallbacks {
  onHealthChange: (hp: number, maxHp: number) => void;
  onStageChange: (stage: number, name: string) => void;
  onCoinsChange: (coins: number) => void;
  onGearChange: (gear: GearType) => void;
  onShiftLockChange: (active: boolean) => void;
  onDisasterUpdate: (state: DisasterWorld['state']) => void;
  onVictory: () => void;
  onDeath: () => void;
}

export class GameEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public skyLighting: SkyAndLighting;

  // Worlds
  public currentMode: GameMode = 'obby';
  public obbyWorld: ObbyWorld;
  public disasterWorld: DisasterWorld;
  public sandboxWorld: SandboxWorld;

  // Player Entity
  public playerAvatar: RobloxAvatar;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 3, 10);
  public playerVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public isGrounded: boolean = false;
  public health: number = 100;
  public maxHealth: number = 100;
  public coins: number = 50;
  public currentStage: number = 0;
  public respawnPos: THREE.Vector3 = new THREE.Vector3(0, 3, 15);
  public isDead: boolean = false;
  public respawnTimer: number = 0;

  // Jump feel: Coyote time & Jump buffering
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private speedBoostTimer: number = 0;

  // Gear inventory
  public activeGear: GearType = 'none';

  // Camera settings
  public cameraDist: number = 14;
  public cameraPitch: number = 0.35;
  public cameraYaw: number = 0;
  public isShiftLocked: boolean = false;
  public isRightMouseDown: boolean = false;
  public cameraSensitivity: number = 1.0;
  private cameraShake: number = 0;

  // Bots
  public bots: BotPlayer[] = [];

  // Projectiles
  public projectiles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

  // Sandbox building tool state
  public buildShape: 'box' | 'cylinder' | 'trampoline' | 'neon' = 'box';
  public buildColor: string = '#3b82f6';
  public buildMaterial: 'plastic' | 'studs' | 'neon' | 'wood' | 'metal' | 'glass' = 'studs';
  public buildSize: [number, number, number] = [4, 2, 4];
  private raycaster = new THREE.Raycaster();
  private mousePos = new THREE.Vector2();

  // Input states
  private keysHeld: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();

  // Callbacks
  private callbacks: EngineCallbacks;

  // Animation frame loop
  private frameId: number = 0;
  private lastTime: number = performance.now();
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, customization: AvatarCustomization, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Renderer Setup
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );

    // 3. Sky, Environment & Lighting
    this.skyLighting = new SkyAndLighting(this.scene, this.renderer);

    // 4. Initialize Worlds
    this.obbyWorld = new ObbyWorld();
    this.disasterWorld = new DisasterWorld();
    this.sandboxWorld = new SandboxWorld();

    this.scene.add(this.obbyWorld.group);

    // 5. Create Player Avatar
    this.playerAvatar = new RobloxAvatar(customization);
    this.scene.add(this.playerAvatar.root);
    this.playerAvatar.root.position.copy(this.playerPos);

    // 6. Spawn Bot Players
    this.spawnBots();

    // 7. Bind Event Listeners
    this.bindEvents();

    // 8. Start Game Loop
    this.startLoop();
  }

  private spawnBots() {
    BOT_CONFIGS.forEach((cfg) => {
      const bot = new BotPlayer(cfg);
      this.bots.push(bot);
      this.scene.add(bot.avatar.root);
    });
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    this.container.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize);
  }

  private unbindEvents() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    this.container.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // If user is currently typing in an input (e.g. Chat box), don't trigger game hotkeys
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();
    if (!this.keysHeld.has(key)) {
      this.keysJustPressed.add(key);
    }
    this.keysHeld.add(key);

    // Hotbar slots [1] - [6]
    if (['1', '2', '3', '4', '5', '6'].includes(key)) {
      const gearList: GearType[] = ['sword', 'gravity_coil', 'speed_coil', 'slingshot', 'bloxy_cola', 'build_tool'];
      const selected = gearList[parseInt(key, 10) - 1];
      this.setGear(this.activeGear === selected ? 'none' : selected);
    }

    // Shift-Lock toggle
    if (e.key === 'Shift') {
      this.toggleShiftLock();
    }

    // Space Jump buffer
    if (e.code === 'Space') {
      this.jumpBufferTimer = 0.14;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.key.toLowerCase());
  };

  private onWindowBlur = () => {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    this.isRightMouseDown = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      // Right Click: Camera Drag
      this.isRightMouseDown = true;
    } else if (e.button === 0) {
      // Left Click: Action with active Gear
      this.handleGearUse();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.isRightMouseDown = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    // Update normalized mouse coordinates for raycasting
    const rect = this.container.getBoundingClientRect();
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Camera orbit when right mouse held or shift-lock active
    if (this.isRightMouseDown || this.isShiftLocked) {
      const sens = 0.0035 * this.cameraSensitivity;
      this.cameraYaw -= e.movementX * sens;
      this.cameraPitch = Math.max(0.05, Math.min(Math.PI * 0.45, this.cameraPitch + e.movementY * sens));
    }

    // Update F3X Build Tool preview if active
    if (this.activeGear === 'build_tool') {
      this.updateBuildPreview();
    }
  };

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.cameraDist = Math.max(2, Math.min(32, this.cameraDist + e.deltaY * 0.02));
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public toggleShiftLock() {
    this.isShiftLocked = !this.isShiftLocked;
    this.callbacks.onShiftLockChange(this.isShiftLocked);
  }

  public setGear(gear: GearType) {
    this.activeGear = gear;
    this.playerAvatar.equipGear(gear);
    this.callbacks.onGearChange(gear);

    if (gear === 'gravity_coil') {
      sounds.playGravityBoing();
    } else if (gear === 'speed_coil') {
      sounds.playSpeedWhoosh();
    }

    if (gear !== 'build_tool') {
      this.sandboxWorld.hidePreview();
    }
  }

  public handleGearUse() {
    if (this.isDead) return;

    if (this.activeGear === 'sword') {
      this.playerAvatar.triggerAction('slash');
      sounds.playSwordSlash();
      this.checkSwordHit();

    } else if (this.activeGear === 'bloxy_cola') {
      this.playerAvatar.triggerAction('drink');
      sounds.playBloxyCola();
      // Restore health
      this.health = Math.min(this.maxHealth, this.health + 35);
      this.callbacks.onHealthChange(this.health, this.maxHealth);

    } else if (this.activeGear === 'slingshot') {
      sounds.playSlingshot();
      this.fireSlingshotPellet();

    } else if (this.activeGear === 'build_tool') {
      this.placeBlockInSandbox();
    }
  }

  private checkSwordHit() {
    // Hit nearby disaster crates or props
    const slashRange = 5.0;
    this.disasterWorld.destructibleParts.forEach((part) => {
      const dist = part.mesh.position.distanceTo(this.playerPos);
      if (dist < slashRange) {
        part.isFallen = true;
        const pushDir = part.mesh.position.clone().sub(this.playerPos).normalize();
        part.velocity.set(pushDir.x * 12, 10, pushDir.z * 12);
        sounds.playBuildSnap();
      }
    });
  }

  private fireSlingshotPellet() {
    const geo = new THREE.SphereGeometry(0.35, 12, 12);
    const pelletColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xfacc15, 0xec4899];
    const mat = new THREE.MeshStandardMaterial({
      color: pelletColors[Math.floor(Math.random() * pelletColors.length)],
      roughness: 0.2,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.playerPos).add(new THREE.Vector3(0, 3.2, 0));
    this.scene.add(mesh);

    // Aim forward based on camera look
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const vel = forward.multiplyScalar(45);

    this.projectiles.push({
      mesh,
      vel,
      life: 3.0,
    });
  }

  private updateBuildPreview() {
    this.raycaster.setFromCamera(this.mousePos, this.camera);
    const intersects = this.raycaster.intersectObjects([
      this.sandboxWorld.baseplate,
      ...Array.from(this.sandboxWorld.blockMeshes.values()),
    ]);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const targetPos = hit.point.clone().add(hit.face?.normal || new THREE.Vector3(0, 1, 0));
      this.sandboxWorld.updatePreview(targetPos, this.buildSize, this.buildShape);
    } else {
      this.sandboxWorld.hidePreview();
    }
  }

  private placeBlockInSandbox() {
    this.raycaster.setFromCamera(this.mousePos, this.camera);
    const intersects = this.raycaster.intersectObjects([
      this.sandboxWorld.baseplate,
      ...Array.from(this.sandboxWorld.blockMeshes.values()),
    ]);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0);
      const targetPos = hit.point.clone().add(normal.clone().multiplyScalar(this.buildSize[1] / 2));

      // Snap to 2x2 grid
      const sx = Math.round(targetPos.x / 2) * 2;
      const sy = Math.max(this.buildSize[1] / 2, Math.round(targetPos.y / 2) * 2);
      const sz = Math.round(targetPos.z / 2) * 2;

      const newBlock: PlacedBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        position: [sx, sy, sz],
        size: this.buildSize,
        shape: this.buildShape,
        color: this.buildColor,
        materialType: this.buildMaterial,
        isSolid: true,
      };

      this.sandboxWorld.addBlock(newBlock);
    }
  }

  public switchMode(mode: GameMode) {
    if (this.currentMode === mode) return;

    // Remove active world
    if (this.currentMode === 'obby') this.scene.remove(this.obbyWorld.group);
    if (this.currentMode === 'disasters') this.scene.remove(this.disasterWorld.group);
    if (this.currentMode === 'sandbox') this.scene.remove(this.sandboxWorld.group);

    this.currentMode = mode;

    // Add new world
    if (mode === 'obby') {
      this.scene.add(this.obbyWorld.group);
      this.respawnPos.set(0, 2, 15);
      this.skyLighting.setDisasterAtmosphere('none');
    } else if (mode === 'disasters') {
      this.scene.add(this.disasterWorld.group);
      this.respawnPos.set(0, 2, 12);
      this.skyLighting.setDisasterAtmosphere(this.disasterWorld.state.activeDisaster);
    } else if (mode === 'sandbox') {
      this.scene.add(this.sandboxWorld.group);
      this.respawnPos.set(0, 2, 0);
      this.skyLighting.setDisasterAtmosphere('none');
    }

    this.respawnPlayer();
  }

  public takeDamage(amount: number, reason?: string) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.callbacks.onHealthChange(this.health, this.maxHealth);
    this.cameraShake = 0.45;

    if (this.health <= 0) {
      this.die();
    }
  }

  public die() {
    if (this.isDead) return;
    this.isDead = true;
    this.health = 0;
    this.callbacks.onHealthChange(0, this.maxHealth);
    this.callbacks.onDeath();

    sounds.playOof();
    this.playerAvatar.triggerDeathRagdoll();
    this.respawnTimer = 1.3;
    this.cameraShake = 0.7;
  }

  public respawnPlayer() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.callbacks.onHealthChange(this.health, this.maxHealth);
    this.playerPos.copy(this.respawnPos);
    this.playerVel.set(0, 0, 0);
    this.playerAvatar.root.position.copy(this.playerPos);
    this.playerAvatar.respawn();
  }

  public updateCustomization(c: AvatarCustomization) {
    this.playerAvatar.updateCustomization(c);
  }

  public triggerEmote(emote: 'dance' | 'wave' | 'cheer') {
    this.playerAvatar.currentAnim = emote;
    // Bots join in on emote fun!
    this.bots.forEach((bot) => {
      if (Math.random() < 0.6) {
        bot.avatar.currentAnim = emote;
      }
    });
  }

  /**
   * Main 60fps Physics & Movement Simulation Tick
   */
  private update(dt: number) {
    // 1. Clamped delta time
    const safeDt = Math.min(dt, 0.05);

    // 2. Dead / Respawn Handling
    if (this.isDead) {
      this.respawnTimer -= safeDt;
      this.playerAvatar.update(safeDt);
      if (this.respawnTimer <= 0) {
        this.respawnPlayer();
      }
      this.updateCamera(safeDt);
      return;
    }

    // 3. Movement Inputs
    _moveDir.set(0, 0, 0);
    if (this.keysHeld.has('w') || this.keysHeld.has('arrowup')) _moveDir.z -= 1;
    if (this.keysHeld.has('s') || this.keysHeld.has('arrowdown')) _moveDir.z += 1;
    if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) _moveDir.x -= 1;
    if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) _moveDir.x += 1;

    const isMoving = _moveDir.lengthSq() > 0.01;
    if (isMoving) _moveDir.normalize();

    // 4. Speed Multipliers (Speed Coil / Speed pads)
    let moveSpeed = 16.0;
    if (this.activeGear === 'speed_coil') {
      moveSpeed *= 2.2;
    }
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= safeDt;
      moveSpeed *= 2.0;
    }

    // Rotate movement vector relative to camera yaw
    if (isMoving) {
      _vec1.copy(_moveDir).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.cameraYaw);
      this.playerVel.x = _vec1.x * moveSpeed;
      this.playerVel.z = _vec1.z * moveSpeed;

      // Rotate avatar face forward or lock to crosshair if Shift-Lock
      if (this.isShiftLocked) {
        this.playerAvatar.root.rotation.y = this.cameraYaw;
      } else {
        const targetAngle = Math.atan2(_vec1.x, _vec1.z);
        this.playerAvatar.root.rotation.y = THREE.MathUtils.damp(
          this.playerAvatar.root.rotation.y,
          targetAngle,
          14,
          safeDt
        );
      }
    } else {
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, 0, 16, safeDt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, 0, 16, safeDt);
      if (this.isShiftLocked) {
        this.playerAvatar.root.rotation.y = this.cameraYaw;
      }
    }

    // 5. Gravity & Vertical Physics
    let gravity = -42.0;
    if (this.activeGear === 'gravity_coil') {
      gravity = -16.0; // Floaty high moon jumps!
    }

    this.playerVel.y += gravity * safeDt;

    // Coyote time timer
    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer -= safeDt;
    }

    // Jump buffer timer
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= safeDt;
      if (this.coyoteTimer > 0) {
        // Crisp jump execution!
        const jumpVel = this.activeGear === 'gravity_coil' ? 24.0 : 18.0;
        this.playerVel.y = jumpVel;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.isGrounded = false;
        sounds.playJump();
      }
    }

    // 6. Integrate Position
    this.playerPos.x += this.playerVel.x * safeDt;
    this.playerPos.y += this.playerVel.y * safeDt;
    this.playerPos.z += this.playerVel.z * safeDt;

    // 7. Collision Detection against Active World
    this.handleWorldCollisions(safeDt);

    // Void death check
    if (this.playerPos.y < -25) {
      this.die();
    }

    // 8. Update Avatar Animations
    this.playerAvatar.isMoving = isMoving;
    this.playerAvatar.isGrounded = this.isGrounded;
    this.playerAvatar.walkSpeed = moveSpeed / 16.0;
    this.playerAvatar.root.position.copy(this.playerPos);
    this.playerAvatar.update(safeDt);

    // 9. Update Active World Systems
    if (this.currentMode === 'obby') {
      this.obbyWorld.update(safeDt);
    } else if (this.currentMode === 'disasters') {
      this.disasterWorld.update(safeDt, () => {
        // Round Survived Reward!
        this.coins += 50;
        this.callbacks.onCoinsChange(this.coins);
        sounds.playVictory();
      });
      this.callbacks.onDisasterUpdate(this.disasterWorld.state);
      this.skyLighting.setDisasterAtmosphere(this.disasterWorld.state.activeDisaster);

      // Check damage from active disaster
      const hazard = this.disasterWorld.checkPlayerDisasterHazard(this.playerPos);
      if (hazard.damaged) {
        this.takeDamage(hazard.damage * safeDt * 3.0, hazard.reason);
      }
    }

    // 10. Update Bots
    this.bots.forEach((bot) => {
      bot.update(safeDt, this.obbyWorld.checkpoints);
    });

    // 11. Update Projectiles
    this.updateProjectiles(safeDt);

    // 12. Update Sky & Clouds
    this.skyLighting.update(safeDt);

    // 13. Update Camera
    this.updateCamera(safeDt);

    // Clear edge-triggered keys
    this.keysJustPressed.clear();
  }

  private handleWorldCollisions(dt: number) {
    this.isGrounded = false;

    // Define player bounding box
    _playerBox.min.set(this.playerPos.x - 1.0, this.playerPos.y, this.playerPos.z - 0.7);
    _playerBox.max.set(this.playerPos.x + 1.0, this.playerPos.y + 4.8, this.playerPos.z + 0.7);

    if (this.currentMode === 'obby') {
      this.obbyWorld.platforms.forEach((plat) => {
        if (!_playerBox.intersectsBox(plat.box)) return;

        if (plat.type === 'lava') {
          // Touch lava = Instant Oof!
          this.die();
          return;
        }

        if (plat.type === 'checkpoint' && plat.spawnPos && plat.stageIndex !== undefined) {
          if (this.currentStage < plat.stageIndex) {
            this.currentStage = plat.stageIndex;
            this.respawnPos.copy(plat.spawnPos);
            this.coins += 25;
            this.callbacks.onStageChange(this.currentStage, plat.stageName || `Stage ${this.currentStage}`);
            this.callbacks.onCoinsChange(this.coins);
            sounds.playCheckpoint();
          }
        }

        if (plat.type === 'winner') {
          this.callbacks.onVictory();
          sounds.playVictory();
        }

        if (plat.type === 'trampoline') {
          this.playerVel.y = 32.0; // Launch high in the air!
          sounds.playJump();
        }

        if (plat.type === 'speed_pad') {
          this.speedBoostTimer = 2.5;
          sounds.playSpeedWhoosh();
        }

        if (plat.type === 'disappearing') {
          this.obbyWorld.stepOnDisappearingTile(plat);
        }

        // Solid ground floor resolution
        if (this.playerVel.y <= 0 && this.playerPos.y >= plat.box.max.y - 1.4) {
          this.playerPos.y = plat.box.max.y;
          this.playerVel.y = 0;
          this.isGrounded = true;
        }
      });

    } else if (this.currentMode === 'disasters') {
      this.disasterWorld.staticBoxes.forEach((box) => {
        if (!_playerBox.intersectsBox(box)) return;
        if (this.playerVel.y <= 0 && this.playerPos.y >= box.max.y - 1.4) {
          this.playerPos.y = box.max.y;
          this.playerVel.y = 0;
          this.isGrounded = true;
        }
      });

    } else if (this.currentMode === 'sandbox') {
      this.sandboxWorld.collisionBoxes.forEach(({ box, type }) => {
        if (!_playerBox.intersectsBox(box)) return;

        if (type === 'trampoline') {
          this.playerVel.y = 30.0;
          sounds.playJump();
          return;
        }

        if (this.playerVel.y <= 0 && this.playerPos.y >= box.max.y - 1.4) {
          this.playerPos.y = box.max.y;
          this.playerVel.y = 0;
          this.isGrounded = true;
        }
      });
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.vel.y -= 15 * dt; // Gravity
      p.mesh.position.addScaledVector(p.vel, dt);

      // Hit ground or props
      if (p.mesh.position.y <= 0 || p.life <= 0) {
        sounds.playPelletHit();
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    // Camera shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0.01) {
      shakeX = (Math.random() - 0.5) * this.cameraShake * 2.0;
      shakeY = (Math.random() - 0.5) * this.cameraShake * 2.0;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
    }

    // Target avatar head center
    const targetY = this.playerPos.y + 2.8;
    _camLook.set(this.playerPos.x, targetY, this.playerPos.z);

    // Spherical offset
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    const dist = this.cameraDist;
    let camX = this.playerPos.x + dist * cosPitch * sinYaw + shakeX;
    let camY = targetY + dist * sinPitch + shakeY;
    let camZ = this.playerPos.z + dist * cosPitch * cosYaw;

    // Shift-Lock over-the-shoulder offset
    if (this.isShiftLocked) {
      const shoulderOffset = 2.0;
      camX += cosYaw * shoulderOffset;
      camZ -= sinYaw * shoulderOffset;
      _camLook.x += cosYaw * shoulderOffset;
      _camLook.z -= sinYaw * shoulderOffset;
    }

    // Smooth camera interpolation
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camX, 16, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camY, 16, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, camZ, 16, dt);
    this.camera.lookAt(_camLook);
  }

  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDestroyed) return;
      const now = performance.now();
      const dt = (now - this.lastTime) * 0.001;
      this.lastTime = now;

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

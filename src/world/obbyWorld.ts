/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createStudTexture, createBaseplateTexture } from '../textures/proceduralTextures';

export interface ObbyPlatform {
  mesh: THREE.Mesh | THREE.Group;
  box: THREE.Box3;
  type: 'solid' | 'lava' | 'checkpoint' | 'disappearing' | 'trampoline' | 'speed_pad' | 'winner';
  stageIndex?: number;
  stageName?: string;
  spawnPos?: THREE.Vector3;
  // Dynamic behavior
  rotSpeed?: number;
  axis?: 'x' | 'y' | 'z';
  oscSpeed?: number;
  oscDist?: number;
  startPos?: THREE.Vector3;
  disappearTimer?: number;
  isDisappeared?: boolean;
}

export class ObbyWorld {
  public group: THREE.Group = new THREE.Group();
  public platforms: ObbyPlatform[] = [];
  public checkpoints: { stage: number; pos: THREE.Vector3; name: string }[] = [];
  public dynamicObjects: ObbyPlatform[] = [];
  public baseplate!: THREE.Mesh;

  constructor() {
    this.buildWorld();
  }

  private buildWorld() {
    const studTex = createStudTexture();
    const baseplateTex = createBaseplateTexture();

    // 1. Giant Classic Baseplate (Spawn Arena)
    const baseGeo = new THREE.BoxGeometry(200, 4, 200);
    const baseMat = new THREE.MeshStandardMaterial({
      map: baseplateTex,
      roughness: 0.6,
      metalness: 0.05,
    });
    this.baseplate = new THREE.Mesh(baseGeo, baseMat);
    this.baseplate.position.set(0, -2, 0);
    this.baseplate.receiveShadow = true;
    this.group.add(this.baseplate);

    // Register spawn platform
    this.registerPlatform(this.baseplate, 'solid');

    // Spawn Plaza Sign / Portal Arch
    this.buildSpawnPlaza();

    // 2. Build 10 Obby Stages stretching in a progressive line
    // Stage 1: Stepping Stones (Z: 40 -> 90)
    this.buildStage1SteppingStones(studTex);

    // Stage 2: Neon Lava Spinners (Z: 100 -> 160)
    this.buildStage2LavaSpinners(studTex);

    // Stage 3: Disappearing Rainbow Tiles (Z: 170 -> 230)
    this.buildStage3DisappearingTiles(studTex);

    // Stage 4: Speed Coil Expressway (Z: 240 -> 310)
    this.buildStage4SpeedExpressway(studTex);

    // Stage 5: Bouncy Trampoline Canyon (Z: 320 -> 390)
    this.buildStage5TrampolineCanyon(studTex);

    // Stage 6: Moving Crusher Blocks (Z: 400 -> 470)
    this.buildStage6CrusherBlocks(studTex);

    // Stage 7: Truss Ladder & Tightrope (Z: 480 -> 550)
    this.buildStage7LaddersAndTightrope(studTex);

    // Stage 8: Gravity Moon Zone (Z: 560 -> 630)
    this.buildStage8MoonZone(studTex);

    // Stage 9: Lava Slide / Roller Slope (Z: 640 -> 720)
    this.buildStage9LavaSlope(studTex);

    // Stage 10: Winner's Cloud Island (Z: 730 -> 800)
    this.buildStage10WinnerParadise(studTex);
  }

  private registerPlatform(
    mesh: THREE.Mesh | THREE.Group,
    type: ObbyPlatform['type'],
    extras: Partial<ObbyPlatform> = {}
  ): ObbyPlatform {
    const box = new THREE.Box3().setFromObject(mesh);
    const plat: ObbyPlatform = {
      mesh,
      box,
      type,
      ...extras,
    };
    this.platforms.push(plat);
    if (extras.rotSpeed || extras.oscSpeed || type === 'disappearing') {
      this.dynamicObjects.push(plat);
    }
    return plat;
  }

  private addCheckpoint(stage: number, name: string, pos: THREE.Vector3) {
    const studTex = createStudTexture();
    const padGroup = new THREE.Group();
    padGroup.position.copy(pos);

    // Base cylinder pad
    const padMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.8, 0.8, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.3,
        metalness: 0.2,
      })
    );
    padMesh.position.y = 0.4;
    padMesh.receiveShadow = true;
    padGroup.add(padMesh);

    // Glowing Neon Ring
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.25, 8, 24),
      new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        emissive: 0x22c55e,
        emissiveIntensity: 1.2,
      })
    );
    ringMesh.position.y = 0.85;
    ringMesh.rotation.x = Math.PI * 0.5;
    padGroup.add(ringMesh);

    // Flag pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
    );
    pole.position.set(3.5, 3.0, 0);
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 })
    );
    flag.position.set(4.5, 5.2, 0);
    padGroup.add(pole, flag);

    this.group.add(padGroup);

    const spawnPos = new THREE.Vector3(pos.x, pos.y + 1.2, pos.z);
    this.checkpoints.push({ stage, pos: spawnPos, name });
    this.registerPlatform(padMesh, 'checkpoint', { stageIndex: stage, stageName: name, spawnPos });
  }

  private buildSpawnPlaza() {
    // Stage 0 Checkpoint
    this.addCheckpoint(0, 'Spawn Plaza', new THREE.Vector3(0, 0, 15));

    // Welcome Arch
    const archGroup = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), pillarMat);
    p1.position.set(-8, 5, 25);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), pillarMat);
    p2.position.set(8, 5, 25);
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(18, 2.5, 2), pillarMat);
    crossbar.position.set(0, 11, 25);

    // Neon glowing letters banner
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.8, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.6,
      })
    );
    sign.position.set(0, 11, 26.1);

    archGroup.add(p1, p2, crossbar, sign);
    this.group.add(archGroup);
  }

  // Stage 1: Stepping Stones
  private buildStage1SteppingStones(studTex: THREE.CanvasTexture) {
    const colors = [0x38bdf8, 0xfacc15, 0xec4899, 0xa855f7, 0x10b981];
    let z = 45;
    let y = 3;

    for (let i = 0; i < 7; i++) {
      const x = Math.sin(i * 1.2) * 5;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.2, 4),
        new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          map: studTex,
          roughness: 0.35,
        })
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.registerPlatform(mesh, 'solid');

      z += 7;
      y += 1.2;
    }

    this.addCheckpoint(1, 'Stage 1: Stepping Stones', new THREE.Vector3(0, y, z + 5));
  }

  // Stage 2: Neon Lava Spinners
  private buildStage2LavaSpinners(studTex: THREE.CanvasTexture) {
    let z = 115;
    let y = 14;

    for (let i = 0; i < 4; i++) {
      // Safe center hub
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3.5, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x475569, map: studTex })
      );
      hub.position.set(0, y, z);
      hub.castShadow = true;
      hub.receiveShadow = true;
      this.group.add(hub);
      this.registerPlatform(hub, 'solid');

      // Rotating neon red laser spinner
      const spinnerGroup = new THREE.Group();
      spinnerGroup.position.set(0, y + 0.8, z);

      const laserMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 1.5,
      });
      const beam1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.5), laserMat);
      const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 10), laserMat);
      spinnerGroup.add(beam1, beam2);
      this.group.add(spinnerGroup);

      this.registerPlatform(spinnerGroup, 'lava', {
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (1.2 + i * 0.3),
        axis: 'y',
      });

      z += 12;
      y += 1.0;
    }

    this.addCheckpoint(2, 'Stage 2: Neon Spinners', new THREE.Vector3(0, y, z + 5));
  }

  // Stage 3: Disappearing Rainbow Tiles
  private buildStage3DisappearingTiles(studTex: THREE.CanvasTexture) {
    let z = 180;
    let y = 19;
    const tileColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x8b5cf6];

    for (let i = 0; i < 8; i++) {
      // 2 adjacent tiles (one disappears quickly, one is solid or disappears later)
      [-2.5, 2.5].forEach((offsetX, colIdx) => {
        const mat = new THREE.MeshStandardMaterial({
          color: tileColors[(i + colIdx) % tileColors.length],
          map: studTex,
          transparent: true,
          opacity: 1.0,
        });
        const tile = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.8, 4), mat);
        tile.position.set(offsetX, y, z);
        tile.castShadow = true;
        this.group.add(tile);

        this.registerPlatform(tile, 'disappearing', {
          disappearTimer: 0,
          isDisappeared: false,
        });
      });

      z += 7;
      y += 0.8;
    }

    this.addCheckpoint(3, 'Stage 3: Rainbow Disappear', new THREE.Vector3(0, y, z + 5));
  }

  // Stage 4: Speed Coil Expressway
  private buildStage4SpeedExpressway(studTex: THREE.CanvasTexture) {
    let z = 250;
    let y = 27;

    // Runway with speed boost pads
    const runway = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.2, 50),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    runway.position.set(0, y, z + 20);
    runway.receiveShadow = true;
    this.group.add(runway);
    this.registerPlatform(runway, 'solid');

    // Neon speed chevron pads on runway
    for (let i = 0; i < 4; i++) {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.1, 4),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 1.5,
        })
      );
      pad.position.set(0, y + 0.65, z + 5 + i * 12);
      this.group.add(pad);
      this.registerPlatform(pad, 'speed_pad');
    }

    // Huge leap gap leading to elevated platform
    const landPad = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.5, 10),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, map: studTex })
    );
    landPad.position.set(0, y + 2, z + 65);
    landPad.receiveShadow = true;
    this.group.add(landPad);
    this.registerPlatform(landPad, 'solid');

    this.addCheckpoint(4, 'Stage 4: Speed Runway', new THREE.Vector3(0, y + 3, z + 65));
  }

  // Stage 5: Bouncy Trampoline Canyon
  private buildStage5TrampolineCanyon(studTex: THREE.CanvasTexture) {
    let z = 330;
    let y = 32;

    // Toxic sludge lake below
    const slime = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1, 60),
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        emissive: 0x15803d,
        emissiveIntensity: 0.8,
      })
    );
    slime.position.set(0, y - 10, z + 25);
    this.group.add(slime);
    this.registerPlatform(slime, 'lava');

    // 4 High Bouncy Mushroom / Trampoline Pads
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 === 0 ? -4 : 4);
      const tramp = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3.5, 1.2, 16),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.6,
        })
      );
      tramp.position.set(x, y, z + i * 14);
      tramp.castShadow = true;
      this.group.add(tramp);
      this.registerPlatform(tramp, 'trampoline');
    }

    this.addCheckpoint(5, 'Stage 5: Trampoline Canyon', new THREE.Vector3(0, y + 8, z + 60));
  }

  // Stage 6: Moving Crusher Blocks
  private buildStage6CrusherBlocks(studTex: THREE.CanvasTexture) {
    let z = 410;
    let y = 42;

    // Narrow bridge path
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 55),
      new THREE.MeshStandardMaterial({ color: 0x64748b, map: studTex })
    );
    bridge.position.set(0, y, z + 25);
    bridge.receiveShadow = true;
    this.group.add(bridge);
    this.registerPlatform(bridge, 'solid');

    // 3 Oscillating hazard crusher blocks sweeping across the bridge
    for (let i = 0; i < 3; i++) {
      const crusher = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 3),
        new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          roughness: 0.2,
          metalness: 0.8,
        })
      );
      const startPos = new THREE.Vector3(0, y + 2.5, z + 12 + i * 14);
      crusher.position.copy(startPos);
      crusher.castShadow = true;
      this.group.add(crusher);

      this.registerPlatform(crusher, 'lava', {
        oscSpeed: 2.0 + i * 0.4,
        oscDist: 7,
        startPos,
        axis: 'x',
      });
    }

    this.addCheckpoint(6, 'Stage 6: The Crushers', new THREE.Vector3(0, y + 2, z + 55));
  }

  // Stage 7: Truss Ladder & Tightrope
  private buildStage7LaddersAndTightrope(studTex: THREE.CanvasTexture) {
    let z = 485;
    let y = 46;

    // Vertical truss tower with climbable steps
    for (let step = 0; step < 12; step++) {
      const ladderRung = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.4, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x9333ea, map: studTex })
      );
      ladderRung.position.set(0, y + step * 1.4, z + step * 1.5);
      ladderRung.castShadow = true;
      this.group.add(ladderRung);
      this.registerPlatform(ladderRung, 'solid');
    }

    y += 18;
    z += 22;

    // Thin balance tightrope beam (width 0.8!)
    const tightrope = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 30),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 })
    );
    tightrope.position.set(0, y, z + 15);
    this.group.add(tightrope);
    this.registerPlatform(tightrope, 'solid');

    this.addCheckpoint(7, 'Stage 7: Tightrope Spire', new THREE.Vector3(0, y + 2, z + 35));
  }

  // Stage 8: Gravity Moon Zone
  private buildStage8MoonZone(studTex: THREE.CanvasTexture) {
    let z = 570;
    let y = 68;

    // Distant floating moon asteroids with wide jumping distances
    for (let i = 0; i < 5; i++) {
      const asteroid = new THREE.Mesh(
        new THREE.DodecahedronGeometry(3.5 + Math.random() * 1.5),
        new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.9,
          metalness: 0.1,
        })
      );
      const ax = (i % 2 === 0 ? -8 : 8);
      asteroid.position.set(ax, y + i * 2, z + i * 16);
      asteroid.castShadow = true;
      this.group.add(asteroid);
      this.registerPlatform(asteroid, 'solid');
    }

    this.addCheckpoint(8, 'Stage 8: Moon Asteroids', new THREE.Vector3(0, y + 12, z + 85));
  }

  // Stage 9: Lava Slide / Roller Slope
  private buildStage9LavaSlope(studTex: THREE.CanvasTexture) {
    let z = 670;
    let y = 82;

    // Steep descending ramp with lava borders
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.2, 50),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, map: studTex })
    );
    ramp.position.set(0, y - 10, z + 20);
    ramp.rotation.x = 0.25;
    ramp.receiveShadow = true;
    this.group.add(ramp);
    this.registerPlatform(ramp, 'solid');

    // Lava stripes running across the slide
    for (let i = 0; i < 4; i++) {
      const lavaBar = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.4, 1.5),
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 1.4,
        })
      );
      lavaBar.position.set(0, y - 5 - i * 4, z + 5 + i * 11);
      lavaBar.rotation.x = 0.25;
      this.group.add(lavaBar);
      this.registerPlatform(lavaBar, 'lava');
    }

    this.addCheckpoint(9, 'Stage 9: Lava Slide', new THREE.Vector3(0, y - 20, z + 55));
  }

  // Stage 10: Winner's Cloud Paradise
  private buildStage10WinnerParadise(studTex: THREE.CanvasTexture) {
    const pos = new THREE.Vector3(0, 65, 760);

    // Floating Golden Cloud Island
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 24, 4, 32),
      new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        roughness: 0.3,
        metalness: 0.1,
      })
    );
    island.position.copy(pos);
    island.receiveShadow = true;
    this.group.add(island);
    this.registerPlatform(island, 'winner', { stageIndex: 10, stageName: "Winner's Paradise!" });

    // Golden Trophy Statue in Center
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(0, pos.y + 2, pos.z);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.15,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 2, 16), goldMat);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 1.2, 4, 16), goldMat);
    cup.position.y = 3;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.5), goldMat);
    star.position.y = 6.2;
    trophyGroup.add(pedestal, cup, star);
    this.group.add(trophyGroup);

    // Victory Checkpoint
    this.addCheckpoint(10, "★ Winner's Cloud Paradise ★", new THREE.Vector3(0, pos.y + 2, pos.z - 10));
  }

  /**
   * Update dynamic rotating spinners, moving crushers, and disappearing tiles
   */
  public update(dt: number) {
    this.dynamicObjects.forEach((plat) => {
      // Rotation
      if (plat.rotSpeed && plat.axis) {
        if (plat.axis === 'y') plat.mesh.rotation.y += plat.rotSpeed * dt;
        if (plat.axis === 'x') plat.mesh.rotation.x += plat.rotSpeed * dt;
        if (plat.axis === 'z') plat.mesh.rotation.z += plat.rotSpeed * dt;
        plat.box.setFromObject(plat.mesh);
      }

      // Oscillation
      if (plat.oscSpeed && plat.startPos && plat.axis && plat.oscDist) {
        const offset = Math.sin(performance.now() * 0.001 * plat.oscSpeed) * plat.oscDist;
        if (plat.axis === 'x') plat.mesh.position.x = plat.startPos.x + offset;
        if (plat.axis === 'y') plat.mesh.position.y = plat.startPos.y + offset;
        if (plat.axis === 'z') plat.mesh.position.z = plat.startPos.z + offset;
        plat.box.setFromObject(plat.mesh);
      }

      // Disappearing tile respawn
      if (plat.type === 'disappearing' && plat.isDisappeared) {
        plat.disappearTimer = (plat.disappearTimer || 0) + dt;
        if (plat.disappearTimer > 2.5) {
          plat.isDisappeared = false;
          plat.mesh.visible = true;
          plat.disappearTimer = 0;
          plat.box.setFromObject(plat.mesh);
        }
      }
    });
  }

  public stepOnDisappearingTile(plat: ObbyPlatform) {
    if (plat.type === 'disappearing' && !plat.isDisappeared) {
      setTimeout(() => {
        plat.isDisappeared = true;
        plat.mesh.visible = false;
        // Move bounding box far away so player drops through
        plat.box.makeEmpty();
      }, 400); // 400ms warning reaction window
    }
  }
}

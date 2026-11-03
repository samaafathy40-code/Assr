/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DisasterState, DisasterType } from '../types/game';
import { createStudTexture } from '../textures/proceduralTextures';
import { sounds } from '../audio/soundEffects';

export interface DestructiblePart {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  velocity: THREE.Vector3;
  isFallen: boolean;
}

export interface ActiveMeteor {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  exploded: boolean;
}

export class DisasterWorld {
  public group: THREE.Group = new THREE.Group();
  public islandMesh!: THREE.Mesh;
  public staticBoxes: THREE.Box3[] = [];
  public destructibleParts: DestructiblePart[] = [];
  public meteors: ActiveMeteor[] = [];
  public lavaMesh!: THREE.Mesh;
  public tornadoGroup: THREE.Group = new THREE.Group();

  public state: DisasterState = {
    activeDisaster: 'none',
    name: 'Intermission',
    description: 'Prepare for the next natural disaster...',
    warningTimeLeft: 10,
    durationTimeLeft: 35,
    state: 'waiting',
    lavaHeight: -5,
  };

  private timer: number = 0;
  private meteorSpawnTimer: number = 0;
  private tornadoPos: THREE.Vector2 = new THREE.Vector2(0, 0);
  private tornadoAngle: number = 0;

  constructor() {
    this.buildMap();
  }

  private buildMap() {
    const studTex = createStudTexture();

    // 1. Grassy Island Base
    const islandGeo = new THREE.CylinderGeometry(40, 44, 8, 32);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.islandMesh = new THREE.Mesh(islandGeo, islandMat);
    this.islandMesh.position.set(0, -4, 0);
    this.islandMesh.receiveShadow = true;
    this.group.add(this.islandMesh);
    this.staticBoxes.push(new THREE.Box3().setFromObject(this.islandMesh));

    // 2. Central 3-Story Survival Tower
    this.buildTower(studTex);

    // 3. Peripheral trees & huts for shelter
    this.buildShelters(studTex);

    // 4. Rising Lava Plane (hidden below island initially)
    const lavaGeo = new THREE.CylinderGeometry(80, 80, 2, 32);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });
    this.lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
    this.lavaMesh.position.set(0, -10, 0);
    this.group.add(this.lavaMesh);

    // 5. Tornado Twister
    this.buildTornado();
  }

  private buildTower(studTex: THREE.CanvasTexture) {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, map: studTex });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });

    // 4 Corner Pillars
    const pillarPositions = [
      [-10, -10],
      [10, -10],
      [-10, 10],
      [10, 10],
    ];

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 32, 2), towerMat);
      pillar.position.set(px, 16, pz);
      pillar.castShadow = true;
      this.group.add(pillar);
      this.staticBoxes.push(new THREE.Box3().setFromObject(pillar));
    });

    // Floor 1: Y = 10
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 22), woodMat);
    floor1.position.set(0, 10, 0);
    floor1.receiveShadow = true;
    this.group.add(floor1);
    this.staticBoxes.push(new THREE.Box3().setFromObject(floor1));

    // Floor 2: Y = 20
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 22), woodMat);
    floor2.position.set(0, 20, 0);
    floor2.receiveShadow = true;
    this.group.add(floor2);
    this.staticBoxes.push(new THREE.Box3().setFromObject(floor2));

    // Floor 3 (Roof Observation Deck): Y = 30
    const roof = new THREE.Mesh(new THREE.BoxGeometry(24, 1.5, 24), towerMat);
    roof.position.set(0, 30, 0);
    roof.receiveShadow = true;
    this.group.add(roof);
    this.staticBoxes.push(new THREE.Box3().setFromObject(roof));

    // Stairways/Ladders to climb up
    for (let f = 0; f < 3; f++) {
      const baseFloorY = f * 10;
      for (let s = 0; s < 8; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 1.2), woodMat);
        step.position.set(-6 + s * 1.5, baseFloorY + s * 1.25, f % 2 === 0 ? 8 : -8);
        this.group.add(step);
        this.staticBoxes.push(new THREE.Box3().setFromObject(step));
      }
    }

    // Destructible decorative walls / crates on tower
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    for (let i = 0; i < 12; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), crateMat);
      crate.position.set(
        (Math.random() - 0.5) * 16,
        11 + (i % 2) * 10,
        (Math.random() - 0.5) * 16
      );
      crate.castShadow = true;
      this.group.add(crate);
      this.destructibleParts.push({
        mesh: crate,
        box: new THREE.Box3().setFromObject(crate),
        velocity: new THREE.Vector3(),
        isFallen: false,
      });
    }
  }

  private buildShelters(studTex: THREE.CanvasTexture) {
    // 2 small stone bunkers for acid rain shelter
    [-24, 24].forEach((sx) => {
      const bunkerRoof = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x334155, map: studTex })
      );
      bunkerRoof.position.set(sx, 6, 0);
      bunkerRoof.castShadow = true;
      this.group.add(bunkerRoof);
      this.staticBoxes.push(new THREE.Box3().setFromObject(bunkerRoof));

      // 4 bunker legs
      [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 6, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        leg.position.set(sx + lx, 3, lz);
        this.group.add(leg);
        this.staticBoxes.push(new THREE.Box3().setFromObject(leg));
      });
    });
  }

  private buildTornado() {
    this.tornadoGroup.visible = false;
    // Multi-layer inverted cones spinning
    const tornadoMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });

    for (let i = 0; i < 5; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(2 + i * 2.5, 8, 12, 1, true),
        tornadoMat
      );
      cone.position.y = 4 + i * 6;
      cone.rotation.x = Math.PI;
      this.tornadoGroup.add(cone);
    }
    this.group.add(this.tornadoGroup);
  }

  public startDisaster(type: DisasterType) {
    this.state.activeDisaster = type;
    this.state.state = 'active';
    this.state.durationTimeLeft = 35;

    if (type === 'meteor_shower') {
      this.state.name = '☄️ METEOR SHOWER';
      this.state.description = 'Flaming meteors are falling from the sky! Avoid impact zones!';
    } else if (type === 'acid_rain') {
      this.state.name = '🧪 ACID RAIN';
      this.state.description = 'Toxic precipitation! Seek shelter under roofs immediately!';
    } else if (type === 'rising_lava') {
      this.state.name = '🌋 RISING LAVA';
      this.state.description = 'The molten lava is rising! Climb to the top floor!';
      this.state.lavaHeight = -5;
    } else if (type === 'tornado') {
      this.state.name = '🌪️ TORNADO';
      this.state.description = 'Violent twister detected! Stay away from its path!';
      this.tornadoGroup.visible = true;
    }

    sounds.playDisasterSiren();
  }

  public endDisaster(survived: boolean) {
    this.state.state = survived ? 'cleared' : 'waiting';
    this.state.activeDisaster = 'none';
    this.state.name = survived ? '★ ROUND SURVIVED! ★' : 'Intermission';
    this.state.description = survived ? 'You survived the catastrophe! +50 Coins awarded!' : 'Preparing next disaster...';
    this.state.warningTimeLeft = 10;
    this.tornadoGroup.visible = false;
    this.lavaMesh.position.y = -10;
  }

  public update(dt: number, onSurviveReward?: () => void) {
    this.timer += dt;

    if (this.state.state === 'waiting' || this.state.state === 'cleared') {
      this.state.warningTimeLeft -= dt;
      if (this.state.warningTimeLeft <= 0) {
        // Pick random disaster
        const disasters: DisasterType[] = ['meteor_shower', 'acid_rain', 'rising_lava', 'tornado'];
        const chosen = disasters[Math.floor(Math.random() * disasters.length)];
        this.startDisaster(chosen);
      }
      return;
    }

    if (this.state.state === 'active') {
      this.state.durationTimeLeft -= dt;

      if (this.state.durationTimeLeft <= 0) {
        this.endDisaster(true);
        if (onSurviveReward) onSurviveReward();
        return;
      }

      // Update specific disaster mechanics
      if (this.state.activeDisaster === 'meteor_shower') {
        this.meteorSpawnTimer += dt;
        if (this.meteorSpawnTimer > 0.8) {
          this.meteorSpawnTimer = 0;
          this.spawnMeteor();
        }
        this.updateMeteors(dt);
      } else if (this.state.activeDisaster === 'rising_lava') {
        // Lava rises towards Y = 26
        this.state.lavaHeight += 1.0 * dt;
        this.lavaMesh.position.y = this.state.lavaHeight;
      } else if (this.state.activeDisaster === 'tornado') {
        // Tornado sweeps around island
        this.tornadoAngle += 0.8 * dt;
        const rad = 20 + Math.sin(this.timer * 0.5) * 10;
        this.tornadoPos.set(Math.cos(this.tornadoAngle) * rad, Math.sin(this.tornadoAngle) * rad);
        this.tornadoGroup.position.set(this.tornadoPos.x, 0, this.tornadoPos.y);
        this.tornadoGroup.rotation.y += 6 * dt;
      }
    }

    // Update fallen destructible parts
    this.destructibleParts.forEach((part) => {
      if (part.isFallen) {
        part.velocity.y -= 25 * dt;
        part.mesh.position.addScaledVector(part.velocity, dt);
        if (part.mesh.position.y < 0) {
          part.mesh.position.y = 0;
          part.velocity.set(0, 0, 0);
        }
        part.box.setFromObject(part.mesh);
      }
    });
  }

  private spawnMeteor() {
    const meteorGeo = new THREE.DodecahedronGeometry(2.0 + Math.random() * 1.5);
    const meteorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 1.8,
    });
    const meteor = new THREE.Mesh(meteorGeo, meteorMat);

    // Target a spot on island
    const tx = (Math.random() - 0.5) * 45;
    const tz = (Math.random() - 0.5) * 45;
    const startX = tx + (Math.random() - 0.5) * 20;
    const startZ = tz + (Math.random() - 0.5) * 20;
    const startY = 90 + Math.random() * 20;

    meteor.position.set(startX, startY, startZ);
    this.group.add(meteor);

    // Velocity downwards toward target
    const target = new THREE.Vector3(tx, 0, tz);
    const vel = target.sub(meteor.position).normalize().multiplyScalar(40);

    this.meteors.push({
      mesh: meteor,
      velocity: vel,
      exploded: false,
    });
  }

  private updateMeteors(dt: number) {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.mesh.position.addScaledVector(m.velocity, dt);
      m.mesh.rotation.x += 4 * dt;
      m.mesh.rotation.y += 3 * dt;

      // Ground or structure impact
      if (m.mesh.position.y <= 0) {
        // Explode
        sounds.playExplosion();
        m.exploded = true;
        this.group.remove(m.mesh);

        // Knock nearby crates/destructibles
        this.destructibleParts.forEach((part) => {
          const dist = part.mesh.position.distanceTo(m.mesh.position);
          if (dist < 12) {
            part.isFallen = true;
            part.velocity.set(
              (part.mesh.position.x - m.mesh.position.x) * 1.5,
              12 + Math.random() * 6,
              (part.mesh.position.z - m.mesh.position.z) * 1.5
            );
          }
        });

        this.meteors.splice(i, 1);
      }
    }
  }

  /**
   * Check if player position is currently harmed by disaster
   */
  public checkPlayerDisasterHazard(playerPos: THREE.Vector3): { damaged: boolean; damage: number; reason: string } {
    if (this.state.state !== 'active') return { damaged: false, damage: 0, reason: '' };

    if (this.state.activeDisaster === 'rising_lava') {
      if (playerPos.y <= this.state.lavaHeight + 0.5) {
        return { damaged: true, damage: 100, reason: 'Melted in rising lava!' };
      }
    } else if (this.state.activeDisaster === 'acid_rain') {
      // Check if player is covered by roof overhead
      let isUnderCover = false;
      this.staticBoxes.forEach((box) => {
        if (
          playerPos.x >= box.min.x &&
          playerPos.x <= box.max.x &&
          playerPos.z >= box.min.z &&
          playerPos.z <= box.max.z &&
          box.min.y > playerPos.y
        ) {
          isUnderCover = true;
        }
      });
      if (!isUnderCover) {
        return { damaged: true, damage: 15, reason: 'Acid rain burn! Find shelter!' };
      }
    } else if (this.state.activeDisaster === 'tornado') {
      const dist = new THREE.Vector2(playerPos.x, playerPos.z).distanceTo(this.tornadoPos);
      if (dist < 7) {
        return { damaged: true, damage: 30, reason: 'Sucked into the tornado!' };
      }
    }

    return { damaged: false, damage: 0, reason: '' };
  }
}

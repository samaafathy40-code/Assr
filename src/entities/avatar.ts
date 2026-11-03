/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { AvatarCustomization, GearType } from '../types/game';
import {
  createFaceTexture,
  createShirtTexture,
  createBloxyColaTexture,
  createStudTexture,
} from '../textures/proceduralTextures';

// Pre-allocate temporary math vectors for zero GC in animation loop
const _v1 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();

export interface RagdollPart {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
}

export class RobloxAvatar {
  public root: THREE.Group;
  public headGroup: THREE.Group;
  public torsoGroup: THREE.Group;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group;

  // Individual mesh pieces
  public headMesh!: THREE.Mesh;
  public torsoMesh!: THREE.Mesh;
  public leftArmMesh!: THREE.Mesh;
  public rightArmMesh!: THREE.Mesh;
  public leftLegMesh!: THREE.Mesh;
  public rightLegMesh!: THREE.Mesh;

  // Face material for easy dynamic face swapping
  private faceMaterial!: THREE.MeshStandardMaterial;
  private torsoFrontMaterial!: THREE.MeshStandardMaterial;

  // Accessories
  public hatGroup: THREE.Group;
  public backAccessoryGroup: THREE.Group;

  // Tool attachment socket in right hand
  public toolSocket: THREE.Group;
  private activeToolMeshes: Map<GearType, THREE.Group> = new Map();

  // Animation state
  public animTime: number = 0;
  public currentAnim: 'idle' | 'walk' | 'jump' | 'fall' | 'dance' | 'wave' | 'cheer' | 'slash' | 'drink' | 'ragdoll' = 'idle';
  public isMoving: boolean = false;
  public isGrounded: boolean = true;
  public walkSpeed: number = 1.0;
  public activeGear: GearType = 'none';

  // Action overrides (slash, drink)
  public actionTime: number = 0;
  public isActionActive: boolean = false;

  // Ragdoll on death
  public ragdollParts: RagdollPart[] = [];
  public isRagdolled: boolean = false;

  constructor(customization: AvatarCustomization) {
    this.root = new THREE.Group();
    this.hatGroup = new THREE.Group();
    this.backAccessoryGroup = new THREE.Group();
    this.toolSocket = new THREE.Group();

    // Groups pivoted at joints
    this.torsoGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.leftArmGroup = new THREE.Group();
    this.rightArmGroup = new THREE.Group();
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();

    this.buildCharacterMesh(customization);
    this.buildGearMeshes();
    this.updateCustomization(customization);
  }

  private buildCharacterMesh(c: AvatarCustomization) {
    const studTex = createStudTexture();
    studTex.repeat.set(1, 1);

    // Common plastic PBR material settings
    const baseMatOpts = {
      roughness: 0.35,
      metalness: 0.05,
    };

    // 1. TORSO (2.0 wide, 2.0 high, 1.0 deep)
    // Pivot at center of torso: (0, 3.0, 0)
    this.torsoGroup.position.set(0, 3.0, 0);

    const torsoGeo = new THREE.BoxGeometry(2.0, 2.0, 1.0);
    const torsoColorMat = new THREE.MeshStandardMaterial({
      color: c.torsoColor,
      ...baseMatOpts,
    });
    this.torsoFrontMaterial = new THREE.MeshStandardMaterial({
      color: c.torsoColor,
      map: createShirtTexture(c.shirtPattern),
      ...baseMatOpts,
    });

    // Torso multi-material: [right, left, top, bottom, front, back]
    const torsoMats = [
      torsoColorMat,
      torsoColorMat,
      new THREE.MeshStandardMaterial({ color: c.torsoColor, map: studTex, ...baseMatOpts }),
      torsoColorMat,
      this.torsoFrontMaterial,
      torsoColorMat,
    ];
    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMats);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // 2. HEAD (1.2 x 1.2 x 1.2)
    // Pivot at neck top: (0, 1.0, 0) relative to torsoGroup
    this.headGroup.position.set(0, 1.0, 0);
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headColorMat = new THREE.MeshStandardMaterial({
      color: c.skinColor,
      ...baseMatOpts,
    });
    this.faceMaterial = new THREE.MeshStandardMaterial({
      color: c.skinColor,
      map: createFaceTexture(c.face),
      ...baseMatOpts,
    });

    const headMats = [
      headColorMat,
      headColorMat,
      new THREE.MeshStandardMaterial({ color: c.skinColor, map: studTex, ...baseMatOpts }),
      headColorMat,
      this.faceMaterial, // front face
      headColorMat,
    ];
    this.headMesh = new THREE.Mesh(headGeo, headMats);
    this.headMesh.position.set(0, 0.6, 0); // center head over neck
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Add hat group attached to head
    this.hatGroup.position.set(0, 0.6, 0);
    this.headGroup.add(this.hatGroup);

    // 3. LEFT ARM (1.0 x 2.0 x 1.0)
    // Pivot at shoulder: (-1.5, 0.8, 0) relative to torsoGroup
    this.leftArmGroup.position.set(-1.5, 0.8, 0);
    const armGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    this.leftArmMesh = new THREE.Mesh(
      armGeo,
      new THREE.MeshStandardMaterial({ color: c.leftArmColor, ...baseMatOpts })
    );
    this.leftArmMesh.position.set(0, -0.8, 0);
    this.leftArmMesh.castShadow = true;
    this.leftArmGroup.add(this.leftArmMesh);

    // 4. RIGHT ARM (1.0 x 2.0 x 1.0)
    // Pivot at shoulder: (1.5, 0.8, 0) relative to torsoGroup
    this.rightArmGroup.position.set(1.5, 0.8, 0);
    this.rightArmMesh = new THREE.Mesh(
      armGeo,
      new THREE.MeshStandardMaterial({ color: c.rightArmColor, ...baseMatOpts })
    );
    this.rightArmMesh.position.set(0, -0.8, 0);
    this.rightArmMesh.castShadow = true;
    this.rightArmGroup.add(this.rightArmMesh);

    // Tool socket at right hand (bottom of arm)
    this.toolSocket.position.set(0, -1.6, 0.4);
    this.rightArmGroup.add(this.toolSocket);

    // 5. LEFT LEG (1.0 x 2.0 x 1.0)
    // Pivot at hip: (-0.5, -1.0, 0) relative to torsoGroup
    this.leftLegGroup.position.set(-0.5, -1.0, 0);
    const legGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    this.leftLegMesh = new THREE.Mesh(
      legGeo,
      new THREE.MeshStandardMaterial({ color: c.leftLegColor, ...baseMatOpts })
    );
    this.leftLegMesh.position.set(0, -1.0, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLegGroup.add(this.leftLegMesh);

    // 6. RIGHT LEG (1.0 x 2.0 x 1.0)
    // Pivot at hip: (0.5, -1.0, 0) relative to torsoGroup
    this.rightLegGroup.position.set(0.5, -1.0, 0);
    this.rightLegMesh = new THREE.Mesh(
      legGeo,
      new THREE.MeshStandardMaterial({ color: c.rightLegColor, ...baseMatOpts })
    );
    this.rightLegMesh.position.set(0, -1.0, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegGroup.add(this.rightLegMesh);

    // Back accessory attached to back of torso
    this.backAccessoryGroup.position.set(0, 0, -0.55);
    this.torsoGroup.add(this.backAccessoryGroup);

    // Assembly
    this.torsoGroup.add(this.headGroup);
    this.torsoGroup.add(this.leftArmGroup);
    this.torsoGroup.add(this.rightArmGroup);
    this.torsoGroup.add(this.leftLegGroup);
    this.torsoGroup.add(this.rightLegGroup);
    this.root.add(this.torsoGroup);
  }

  public updateCustomization(c: AvatarCustomization) {
    // Colors
    (this.headMesh.material as THREE.MeshStandardMaterial[])[0].color.set(c.skinColor);
    (this.headMesh.material as THREE.MeshStandardMaterial[])[1].color.set(c.skinColor);
    (this.headMesh.material as THREE.MeshStandardMaterial[])[2].color.set(c.skinColor);
    (this.headMesh.material as THREE.MeshStandardMaterial[])[3].color.set(c.skinColor);
    (this.headMesh.material as THREE.MeshStandardMaterial[])[4].color.set(c.skinColor);
    (this.headMesh.material as THREE.MeshStandardMaterial[])[5].color.set(c.skinColor);
    this.faceMaterial.map = createFaceTexture(c.face);
    this.faceMaterial.needsUpdate = true;

    // Torso
    const torsoMats = this.torsoMesh.material as THREE.MeshStandardMaterial[];
    torsoMats[0].color.set(c.torsoColor);
    torsoMats[1].color.set(c.torsoColor);
    torsoMats[2].color.set(c.torsoColor);
    torsoMats[3].color.set(c.torsoColor);
    torsoMats[4].color.set(c.torsoColor);
    torsoMats[4].map = createShirtTexture(c.shirtPattern);
    torsoMats[4].needsUpdate = true;
    torsoMats[5].color.set(c.torsoColor);

    (this.leftArmMesh.material as THREE.MeshStandardMaterial).color.set(c.leftArmColor);
    (this.rightArmMesh.material as THREE.MeshStandardMaterial).color.set(c.rightArmColor);
    (this.leftLegMesh.material as THREE.MeshStandardMaterial).color.set(c.leftLegColor);
    (this.rightLegMesh.material as THREE.MeshStandardMaterial).color.set(c.rightLegColor);

    // Hats
    this.rebuildHat(c.hat);
    // Back accessories
    this.rebuildBackAccessory(c.backAccessory);
  }

  private rebuildHat(hat: AvatarCustomization['hat']) {
    while (this.hatGroup.children.length > 0) {
      const obj = this.hatGroup.children[0];
      this.hatGroup.remove(obj);
    }

    if (hat === 'hard_hat') {
      // Classic Yellow Builder Hard Hat
      const hatMeshGroup = new THREE.Group();
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffd000, roughness: 0.3 })
      );
      dome.position.y = 0.55;
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0xffd000, roughness: 0.3 })
      );
      brim.position.y = 0.56;
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xebbb00, roughness: 0.3 })
      );
      ridge.position.y = 0.95;
      hatMeshGroup.add(dome, brim, ridge);
      this.hatGroup.add(hatMeshGroup);

    } else if (hat === 'party_hat') {
      // Striped cone party hat
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 1.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.4 })
      );
      cone.position.set(0, 1.2, 0);
      const pom = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
      );
      pom.position.set(0, 1.8, 0);
      this.hatGroup.add(cone, pom);

    } else if (hat === 'dominus') {
      // Dominus Aureus: Dark hood with glowing cyan eyes
      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 1.35, 1.35),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
      );
      hood.position.set(0, 0.05, 0);

      // Glowing cyan eye slits
      const eyeGeo = new THREE.PlaneGeometry(0.25, 0.08);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.25, 0.0, 0.69);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.25, 0.0, 0.69);

      // Golden side wings
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
      const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), wingMat);
      leftWing.position.set(-0.8, 0.2, 0);
      leftWing.rotation.z = Math.PI * 0.3;
      const rightWing = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), wingMat);
      rightWing.position.set(0.8, 0.2, 0);
      rightWing.rotation.z = -Math.PI * 0.3;

      this.hatGroup.add(hood, leftEye, rightEye, leftWing, rightWing);

    } else if (hat === 'valkyrie') {
      // Valkyrie silver helm with gold wings
      const helm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.75, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 })
      );
      helm.position.y = 0.6;
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.25 });
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.4), wingMat);
      leftWing.position.set(-0.8, 0.9, 0);
      leftWing.rotation.z = 0.2;
      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.4), wingMat);
      rightWing.position.set(0.8, 0.9, 0);
      rightWing.rotation.z = -0.2;
      this.hatGroup.add(helm, leftWing, rightWing);

    } else if (hat === 'headphones') {
      // Neon DJ Headphones
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.08, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3 })
      );
      band.position.set(0, 0.5, 0);
      band.rotation.z = -Math.PI * 0.5;

      const cupMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.5 });
      const leftCup = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), cupMat);
      leftCup.position.set(-0.68, 0.0, 0);
      leftCup.rotation.z = Math.PI * 0.5;
      const rightCup = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), cupMat);
      rightCup.position.set(0.68, 0.0, 0);
      rightCup.rotation.z = Math.PI * 0.5;

      this.hatGroup.add(band, leftCup, rightCup);

    } else if (hat === 'horns') {
      // Glowing devil horns
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6 });
      const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 8), hornMat);
      leftHorn.position.set(-0.45, 0.8, 0.2);
      leftHorn.rotation.set(-0.3, 0, 0.4);
      const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 8), hornMat);
      rightHorn.position.set(0.45, 0.8, 0.2);
      rightHorn.rotation.set(-0.3, 0, -0.4);
      this.hatGroup.add(leftHorn, rightHorn);

    } else if (hat === 'halo') {
      // Golden Angel Halo
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.08, 8, 24),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.8,
          metalness: 0.8,
          roughness: 0.2,
        })
      );
      halo.position.set(0, 1.25, 0);
      halo.rotation.x = Math.PI * 0.5;
      this.hatGroup.add(halo);
    }
  }

  private rebuildBackAccessory(acc: AvatarCustomization['backAccessory']) {
    while (this.backAccessoryGroup.children.length > 0) {
      const obj = this.backAccessoryGroup.children[0];
      this.backAccessoryGroup.remove(obj);
    }

    if (acc === 'sword_sheath') {
      // Slanted silver katana on back
      const sword = new THREE.Group();
      const scabbard = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 2.4, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      const hilt = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.8, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 })
      );
      hilt.position.y = 1.4;
      const guard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
      );
      guard.position.y = 1.0;
      sword.add(scabbard, hilt, guard);
      sword.rotation.z = -Math.PI * 0.25;
      this.backAccessoryGroup.add(sword);

    } else if (acc === 'wings') {
      // Cyan glowing wings
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.85,
      });
      const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 4), wingMat);
      leftWing.position.set(-1.2, 0.5, 0);
      leftWing.rotation.set(0, 0, Math.PI * 0.35);
      const rightWing = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 4), wingMat);
      rightWing.position.set(1.2, 0.5, 0);
      rightWing.rotation.set(0, 0, -Math.PI * 0.35);
      this.backAccessoryGroup.add(leftWing, rightWing);

    } else if (acc === 'cape') {
      // Heroic red cape hanging from neck
      const cape = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.4, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 })
      );
      cape.position.set(0, -0.4, -0.05);
      cape.rotation.x = -0.15;
      this.backAccessoryGroup.add(cape);
    }
  }

  /**
   * Build 3D models for all 6 handheld gears
   */
  private buildGearMeshes() {
    // 1. Sword
    const swordGroup = new THREE.Group();
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.6, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
    );
    blade.position.y = 1.3;
    const bladeTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.4, 4),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
    );
    bladeTip.position.y = 2.8;
    bladeTip.rotation.y = Math.PI * 0.25;
    const swordHilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    );
    swordHilt.position.y = -0.4;
    const swordGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
    );
    swordGuard.position.y = 0.0;
    swordGroup.add(blade, bladeTip, swordHilt, swordGuard);
    swordGroup.rotation.x = Math.PI * 0.4;
    this.activeToolMeshes.set('sword', swordGroup);

    // 2. Gravity Coil (Blue coiled spring)
    const gravGroup = new THREE.Group();
    const gravSpring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.09, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.6, metalness: 0.6 })
    );
    const gravHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    gravHandle.position.y = -0.3;
    gravGroup.add(gravSpring, gravHandle);
    this.activeToolMeshes.set('gravity_coil', gravGroup);

    // 3. Speed Coil (Red coiled spring)
    const speedGroup = new THREE.Group();
    const speedSpring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.09, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6, metalness: 0.6 })
    );
    const speedHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    speedHandle.position.y = -0.3;
    speedGroup.add(speedSpring, speedHandle);
    this.activeToolMeshes.set('speed_coil', speedGroup);

    // 4. Slingshot
    const slingGroup = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    const forkLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    forkLeft.position.set(-0.25, 0.55, 0);
    forkLeft.rotation.z = -0.35;
    const forkRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    forkRight.position.set(0.25, 0.55, 0);
    forkRight.rotation.z = 0.35;
    slingGroup.add(handle, forkLeft, forkRight);
    slingGroup.rotation.x = Math.PI * 0.35;
    this.activeToolMeshes.set('slingshot', slingGroup);

    // 5. Bloxy Cola Can
    const colaGroup = new THREE.Group();
    const canGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.7, 16);
    const canSideMat = new THREE.MeshStandardMaterial({
      map: createBloxyColaTexture(),
      roughness: 0.3,
      metalness: 0.4,
    });
    const canRimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const canMesh = new THREE.Mesh(canGeo, [canSideMat, canRimMat, canRimMat]);
    colaGroup.add(canMesh);
    this.activeToolMeshes.set('bloxy_cola', colaGroup);

    // 6. Build Tool (F3X Hammer / Trowel)
    const buildGroup = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 })
    );
    const hammerHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.7,
        metalness: 0.5,
      })
    );
    hammerHead.position.y = 0.5;
    buildGroup.add(shaft, hammerHead);
    buildGroup.rotation.x = Math.PI * 0.3;
    this.activeToolMeshes.set('build_tool', buildGroup);
  }

  public equipGear(gear: GearType) {
    this.activeGear = gear;
    while (this.toolSocket.children.length > 0) {
      this.toolSocket.remove(this.toolSocket.children[0]);
    }
    const mesh = this.activeToolMeshes.get(gear);
    if (mesh) {
      this.toolSocket.add(mesh);
    }
  }

  /**
   * Trigger action animation (e.g., sword slash or cola sip)
   */
  public triggerAction(action: 'slash' | 'drink') {
    this.currentAnim = action;
    this.actionTime = 0;
    this.isActionActive = true;
  }

  /**
   * Ragdoll / shatter avatar body parts on death
   */
  public triggerDeathRagdoll() {
    if (this.isRagdolled) return;
    this.isRagdolled = true;
    this.currentAnim = 'ragdoll';
    this.ragdollParts = [];

    // Detach each limb from parent and move directly into root scene with world transforms
    const parts = [
      { mesh: this.headMesh, offset: new THREE.Vector3(0, 4.6, 0) },
      { mesh: this.torsoMesh, offset: new THREE.Vector3(0, 3.0, 0) },
      { mesh: this.leftArmMesh, offset: new THREE.Vector3(-1.5, 3.0, 0) },
      { mesh: this.rightArmMesh, offset: new THREE.Vector3(1.5, 3.0, 0) },
      { mesh: this.leftLegMesh, offset: new THREE.Vector3(-0.5, 1.0, 0) },
      { mesh: this.rightLegMesh, offset: new THREE.Vector3(0.5, 1.0, 0) },
    ];

    parts.forEach(({ mesh, offset }) => {
      mesh.getWorldPosition(_v1);
      mesh.getWorldQuaternion(_q1);

      // Reposition relative to root
      this.root.add(mesh);
      mesh.position.copy(_v1.sub(this.root.position));
      mesh.quaternion.copy(_q1);

      // Add violent explosion impulse
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        8 + Math.random() * 8,
        (Math.random() - 0.5) * 14
      );
      const angVel = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );

      this.ragdollParts.push({
        mesh,
        velocity: vel,
        angularVelocity: angVel,
      });
    });

    // Hide original joint groups
    this.torsoGroup.visible = false;
  }

  /**
   * Restore character from ragdoll
   */
  public respawn() {
    this.isRagdolled = false;
    this.currentAnim = 'idle';
    this.actionTime = 0;
    this.isActionActive = false;
    this.ragdollParts = [];

    // Reattach meshes to original groups
    this.torsoGroup.add(this.torsoMesh);
    this.torsoMesh.position.set(0, 0, 0);
    this.torsoMesh.rotation.set(0, 0, 0);

    this.headGroup.add(this.headMesh);
    this.headMesh.position.set(0, 0.6, 0);
    this.headMesh.rotation.set(0, 0, 0);

    this.leftArmGroup.add(this.leftArmMesh);
    this.leftArmMesh.position.set(0, -0.8, 0);
    this.leftArmMesh.rotation.set(0, 0, 0);

    this.rightArmGroup.add(this.rightArmMesh);
    this.rightArmMesh.position.set(0, -0.8, 0);
    this.rightArmMesh.rotation.set(0, 0, 0);

    this.leftLegGroup.add(this.leftLegMesh);
    this.leftLegMesh.position.set(0, -1.0, 0);
    this.leftLegMesh.rotation.set(0, 0, 0);

    this.rightLegGroup.add(this.rightLegMesh);
    this.rightLegMesh.position.set(0, -1.0, 0);
    this.rightLegMesh.rotation.set(0, 0, 0);

    this.torsoGroup.visible = true;
    this.resetJointRotations();
  }

  private resetJointRotations() {
    this.headGroup.rotation.set(0, 0, 0);
    this.torsoGroup.rotation.set(0, 0, 0);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
  }

  /**
   * Update character animations every frame
   */
  public update(dt: number) {
    if (this.isRagdolled) {
      // Simulate physics for loose blocky body parts
      const gravity = -30 * dt;
      this.ragdollParts.forEach((part) => {
        part.velocity.y += gravity;
        part.mesh.position.addScaledVector(part.velocity, dt);

        part.mesh.rotation.x += part.angularVelocity.x * dt;
        part.mesh.rotation.y += part.angularVelocity.y * dt;
        part.mesh.rotation.z += part.angularVelocity.z * dt;

        // Ground floor bounce/friction
        if (part.mesh.position.y < 0.5) {
          part.mesh.position.y = 0.5;
          part.velocity.y = -part.velocity.y * 0.4;
          part.velocity.x *= 0.85;
          part.velocity.z *= 0.85;
          part.angularVelocity.multiplyScalar(0.85);
        }
      });
      return;
    }

    this.animTime += dt;

    // Handle action animation timer (e.g. sword swing)
    if (this.isActionActive) {
      this.actionTime += dt;
      if (this.currentAnim === 'slash') {
        const progress = Math.min(this.actionTime / 0.35, 1.0);
        // Swift horizontal slash: arm pulls back then sweeps across
        if (progress < 0.3) {
          const p = progress / 0.3;
          this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI * 0.6, p);
          this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(0, Math.PI * 0.3, p);
        } else {
          const p = (progress - 0.3) / 0.7;
          this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.6, Math.PI * 0.5, p);
          this.rightArmGroup.rotation.y = THREE.MathUtils.lerp(0, -Math.PI * 0.6, p);
          this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(Math.PI * 0.3, -Math.PI * 0.2, p);
        }
        if (progress >= 1.0) {
          this.isActionActive = false;
          this.currentAnim = this.isMoving ? 'walk' : 'idle';
        }
        return;
      } else if (this.currentAnim === 'drink') {
        const progress = Math.min(this.actionTime / 1.0, 1.0);
        // Bring can to head
        this.rightArmGroup.rotation.x = -Math.PI * 0.7;
        this.rightArmGroup.rotation.y = -Math.PI * 0.2;
        this.headGroup.rotation.x = -0.3;
        if (progress >= 1.0) {
          this.isActionActive = false;
          this.currentAnim = this.isMoving ? 'walk' : 'idle';
        }
        return;
      }
    }

    // Determine basic state if no action active
    if (!this.isGrounded) {
      // In mid-air: Jump or Fall
      this.currentAnim = 'jump';
      const armTarget = -Math.PI * 0.8;
      const legTarget = Math.PI * 0.2;
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, armTarget, 12, dt);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, armTarget, 12, dt);
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, legTarget, 12, dt);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, -legTarget, 12, dt);
      this.torsoGroup.position.y = 3.0;
      return;
    }

    if (this.currentAnim === 'dance') {
      // Roblox /e dance: side-to-side groove
      const t = this.animTime * 6;
      this.torsoGroup.rotation.z = Math.sin(t) * 0.18;
      this.torsoGroup.position.y = 3.0 + Math.abs(Math.sin(t * 2)) * 0.15;
      this.headGroup.rotation.z = -Math.sin(t) * 0.25;
      this.leftArmGroup.rotation.z = Math.PI * 0.4 + Math.sin(t) * 0.3;
      this.rightArmGroup.rotation.z = -Math.PI * 0.4 - Math.sin(t) * 0.3;
      this.leftArmGroup.rotation.x = Math.cos(t) * 0.4;
      this.rightArmGroup.rotation.x = -Math.cos(t) * 0.4;
      this.leftLegGroup.rotation.z = Math.sin(t) * 0.12;
      this.rightLegGroup.rotation.z = Math.sin(t) * 0.12;
      return;
    }

    if (this.currentAnim === 'wave') {
      // Roblox /e wave: right hand held high waving
      const t = this.animTime * 8;
      this.rightArmGroup.rotation.x = -Math.PI * 0.85;
      this.rightArmGroup.rotation.z = Math.sin(t) * 0.35;
      this.leftArmGroup.rotation.set(0, 0, 0);
      this.headGroup.rotation.y = 0.2;
      return;
    }

    if (this.currentAnim === 'cheer') {
      // Roblox /e cheer: both arms up cheering and small hops
      const t = this.animTime * 10;
      this.torsoGroup.position.y = 3.0 + Math.max(0, Math.sin(t) * 0.35);
      this.leftArmGroup.rotation.x = -Math.PI * 0.9;
      this.rightArmGroup.rotation.x = -Math.PI * 0.9;
      this.leftArmGroup.rotation.z = 0.3 + Math.sin(t) * 0.2;
      this.rightArmGroup.rotation.z = -0.3 - Math.sin(t) * 0.2;
      return;
    }

    if (this.isMoving) {
      // Classic Roblox Walk Cycle
      const walkFreq = 9.0 * this.walkSpeed;
      const angle = Math.sin(this.animTime * walkFreq) * 0.85;

      // Legs swing in opposition
      this.leftLegGroup.rotation.x = angle;
      this.rightLegGroup.rotation.x = -angle;

      // Arms swing in opposition to legs (left arm forward with right leg)
      this.leftArmGroup.rotation.x = -angle;
      // If holding tool, dampen arm swing so tool doesn't flail wild
      const rightArmFactor = this.activeGear !== 'none' ? 0.3 : 1.0;
      this.rightArmGroup.rotation.x = angle * rightArmFactor;

      // Torso slight vertical bob
      this.torsoGroup.position.y = 3.0 + Math.abs(Math.sin(this.animTime * walkFreq * 2)) * 0.12;
      this.torsoGroup.rotation.y = Math.sin(this.animTime * walkFreq) * 0.08;
    } else {
      // Idle Breathing
      const breath = Math.sin(this.animTime * 2.5);
      this.torsoGroup.position.y = 3.0 + breath * 0.03;
      this.leftArmGroup.rotation.x = breath * 0.04;
      this.rightArmGroup.rotation.x = -breath * 0.04;
      this.leftLegGroup.rotation.x = 0;
      this.rightLegGroup.rotation.x = 0;
      this.torsoGroup.rotation.y = 0;
      this.headGroup.rotation.y = Math.sin(this.animTime * 0.8) * 0.1;
    }
  }
}

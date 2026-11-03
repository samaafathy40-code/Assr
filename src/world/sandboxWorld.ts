/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlacedBlock } from '../types/game';
import { createStudTexture, createBaseplateTexture } from '../textures/proceduralTextures';
import { sounds } from '../audio/soundEffects';

export class SandboxWorld {
  public group: THREE.Group = new THREE.Group();
  public baseplate!: THREE.Mesh;
  public placedBlocks: PlacedBlock[] = [];
  public blockMeshes: Map<string, THREE.Mesh> = new Map();
  public collisionBoxes: { id: string; box: THREE.Box3; type: string }[] = [];
  public previewMesh!: THREE.Mesh;

  constructor() {
    this.buildBaseplate();
    this.setupPreviewMesh();
    this.loadSampleBuild('obby_playground');
  }

  private buildBaseplate() {
    const baseplateTex = createBaseplateTexture();
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

    this.collisionBoxes.push({
      id: 'baseplate',
      box: new THREE.Box3().setFromObject(this.baseplate),
      type: 'solid',
    });
  }

  private setupPreviewMesh() {
    const geo = new THREE.BoxGeometry(4, 2, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    this.previewMesh = new THREE.Mesh(geo, mat);
    this.previewMesh.visible = false;
    this.group.add(this.previewMesh);
  }

  public updatePreview(pos: THREE.Vector3, size: [number, number, number], shape: string) {
    // Snap pos to 2x2 grid
    const sx = Math.round(pos.x / 2) * 2;
    const sy = Math.max(size[1] / 2, Math.round(pos.y / 2) * 2);
    const sz = Math.round(pos.z / 2) * 2;

    this.previewMesh.position.set(sx, sy, sz);
    this.previewMesh.scale.set(size[0] / 4, size[1] / 2, size[2] / 4);
    this.previewMesh.visible = true;
  }

  public hidePreview() {
    this.previewMesh.visible = false;
  }

  public addBlock(block: PlacedBlock): boolean {
    const studTex = createStudTexture();

    let geo: THREE.BufferGeometry;
    if (block.shape === 'cylinder') {
      geo = new THREE.CylinderGeometry(block.size[0] / 2, block.size[0] / 2, block.size[1], 16);
    } else {
      geo = new THREE.BoxGeometry(block.size[0], block.size[1], block.size[2]);
    }

    let mat: THREE.Material;
    if (block.materialType === 'neon' || block.shape === 'neon') {
      mat = new THREE.MeshStandardMaterial({
        color: block.color,
        emissive: block.color,
        emissiveIntensity: 1.5,
      });
    } else if (block.materialType === 'glass') {
      mat = new THREE.MeshPhysicalMaterial({
        color: block.color,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        metalness: 0.1,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: block.color,
        map: block.materialType === 'studs' ? studTex : undefined,
        roughness: block.materialType === 'metal' ? 0.2 : 0.4,
        metalness: block.materialType === 'metal' ? 0.8 : 0.05,
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...block.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.group.add(mesh);
    this.blockMeshes.set(block.id, mesh);
    this.placedBlocks.push(block);

    const box = new THREE.Box3().setFromObject(mesh);
    this.collisionBoxes.push({
      id: block.id,
      box,
      type: block.shape === 'trampoline' ? 'trampoline' : 'solid',
    });

    sounds.playBuildSnap();
    return true;
  }

  public removeBlock(id: string) {
    const mesh = this.blockMeshes.get(id);
    if (mesh) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      this.blockMeshes.delete(id);
    }
    this.placedBlocks = this.placedBlocks.filter((b) => b.id !== id);
    this.collisionBoxes = this.collisionBoxes.filter((cb) => cb.id !== id);
  }

  public clearAll() {
    this.placedBlocks.forEach((b) => {
      const mesh = this.blockMeshes.get(b.id);
      if (mesh) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
      }
    });
    this.placedBlocks = [];
    this.blockMeshes.clear();
    this.collisionBoxes = this.collisionBoxes.filter((cb) => cb.id === 'baseplate');
  }

  public loadSampleBuild(type: 'obby_playground' | 'castle' | 'blox_house') {
    this.clearAll();

    if (type === 'obby_playground') {
      // Fun mini playground with trampolines, stairs, and neon towers
      const sampleBlocks: PlacedBlock[] = [
        // Steps
        { id: 'p1', position: [0, 1, 10], size: [6, 2, 4], shape: 'box', color: '#3b82f6', materialType: 'studs', isSolid: true },
        { id: 'p2', position: [0, 2.5, 15], size: [6, 3, 4], shape: 'box', color: '#eab308', materialType: 'studs', isSolid: true },
        { id: 'p3', position: [0, 4.5, 20], size: [6, 4, 4], shape: 'box', color: '#ef4444', materialType: 'studs', isSolid: true },
        // High trampoline launch pad
        { id: 'p4', position: [0, 7, 26], size: [6, 1, 6], shape: 'trampoline', color: '#ec4899', materialType: 'neon', isSolid: true },
        // Sky landing platform
        { id: 'p5', position: [0, 16, 42], size: [12, 1.5, 12], shape: 'box', color: '#06b6d4', materialType: 'studs', isSolid: true },
        // Slide / bridge
        { id: 'p6', position: [10, 14, 42], size: [8, 1, 4], shape: 'box', color: '#22c55e', materialType: 'studs', isSolid: true },
        { id: 'p7', position: [18, 11, 42], size: [8, 1, 4], shape: 'box', color: '#22c55e', materialType: 'studs', isSolid: true },
        { id: 'p8', position: [24, 7, 42], size: [6, 1, 6], shape: 'trampoline', color: '#a855f7', materialType: 'neon', isSolid: true },
        // Decorative neon pillars
        { id: 'p9', position: [-6, 10, 42], size: [2, 10, 2], shape: 'box', color: '#00f0ff', materialType: 'neon', isSolid: true },
        { id: 'p10', position: [6, 10, 42], size: [2, 10, 2], shape: 'box', color: '#00f0ff', materialType: 'neon', isSolid: true },
      ];
      sampleBlocks.forEach((b) => this.addBlock(b));

    } else if (type === 'castle') {
      const sampleBlocks: PlacedBlock[] = [
        // Main gate
        { id: 'c1', position: [-8, 6, 0], size: [4, 12, 4], shape: 'box', color: '#64748b', materialType: 'studs', isSolid: true },
        { id: 'c2', position: [8, 6, 0], size: [4, 12, 4], shape: 'box', color: '#64748b', materialType: 'studs', isSolid: true },
        { id: 'c3', position: [0, 11, 0], size: [12, 2, 4], shape: 'box', color: '#475569', materialType: 'studs', isSolid: true },
        // Walls
        { id: 'c4', position: [-16, 4, 0], size: [12, 8, 3], shape: 'box', color: '#94a3b8', materialType: 'studs', isSolid: true },
        { id: 'c5', position: [16, 4, 0], size: [12, 8, 3], shape: 'box', color: '#94a3b8', materialType: 'studs', isSolid: true },
        // Tower tops
        { id: 'c6', position: [-8, 13, 0], size: [5, 2, 5], shape: 'box', color: '#dc2626', materialType: 'studs', isSolid: true },
        { id: 'c7', position: [8, 13, 0], size: [5, 2, 5], shape: 'box', color: '#dc2626', materialType: 'studs', isSolid: true },
        // Golden throne
        { id: 'c8', position: [0, 2, 15], size: [4, 4, 4], shape: 'box', color: '#facc15', materialType: 'neon', isSolid: true },
      ];
      sampleBlocks.forEach((b) => this.addBlock(b));

    } else if (type === 'blox_house') {
      const sampleBlocks: PlacedBlock[] = [
        // Floor
        { id: 'h1', position: [0, 0.5, 10], size: [18, 1, 16], shape: 'box', color: '#b45309', materialType: 'wood', isSolid: true },
        // Walls
        { id: 'h2', position: [-8.5, 5, 10], size: [1, 8, 16], shape: 'box', color: '#f8fafc', materialType: 'studs', isSolid: true },
        { id: 'h3', position: [8.5, 5, 10], size: [1, 8, 16], shape: 'box', color: '#f8fafc', materialType: 'studs', isSolid: true },
        { id: 'h4', position: [0, 5, 17.5], size: [16, 8, 1], shape: 'box', color: '#f8fafc', materialType: 'studs', isSolid: true },
        // Front wall pieces with door opening
        { id: 'h5', position: [-5, 5, 2.5], size: [6, 8, 1], shape: 'box', color: '#f8fafc', materialType: 'studs', isSolid: true },
        { id: 'h6', position: [5, 5, 2.5], size: [6, 8, 1], shape: 'box', color: '#f8fafc', materialType: 'studs', isSolid: true },
        { id: 'h7', position: [0, 7.5, 2.5], size: [4, 3, 1], shape: 'box', color: '#f8fafc', materialType: 'studs', isSolid: true },
        // Roof
        { id: 'h8', position: [0, 9.5, 10], size: [20, 1.5, 18], shape: 'box', color: '#dc2626', materialType: 'studs', isSolid: true },
        // Chimney
        { id: 'h9', position: [6, 12, 6], size: [2.5, 6, 2.5], shape: 'box', color: '#78350f', materialType: 'studs', isSolid: true },
        // Interior Neon Lamp
        { id: 'h10', position: [0, 7.5, 10], size: [1.5, 1.5, 1.5], shape: 'box', color: '#fef08a', materialType: 'neon', isSolid: false },
      ];
      sampleBlocks.forEach((b) => this.addBlock(b));
    }
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const isSoftwareGl = (() => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

export class SkyAndLighting {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public dirLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public skyDome!: THREE.Mesh;
  public clouds: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.setupEnvironment();
    this.setupLights();
    this.setupSky();
  }

  private setupEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Roblox sky horizon fog
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 350);
    this.scene.background = new THREE.Color(0x87ceeb);
  }

  private setupLights() {
    // 1. Cool Sky / Warm Ground Hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x3b822e, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Warm Sun Key Light with PCF Soft Shadows
    this.dirLight = new THREE.DirectionalLight(0xfff6dd, 1.4);
    this.dirLight.position.set(60, 100, 45);
    this.dirLight.castShadow = !isSoftwareGl;

    if (!isSoftwareGl) {
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      const d = 120;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 300;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    // 3. Subtle ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambientLight);
  }

  private setupSky() {
    // Stylized cartoon gradient sky dome
    const skyGeo = new THREE.SphereGeometry(400, 24, 16);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1d4ed8');   // deep blue zenith
    grad.addColorStop(0.5, '#60a5fa'); // roblox sky cyan
    grad.addColorStop(0.85, '#bae6fd'); // horizon haze
    grad.addColorStop(1.0, '#e0f2fe');  // ground blend
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);

    const skyTex = new THREE.CanvasTexture(canvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);

    // Procedural Puffy Blocky Roblox Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
    });

    for (let i = 0; i < 25; i++) {
      const cloudGroup = new THREE.Group();
      const px = (Math.random() - 0.5) * 500;
      const py = 75 + Math.random() * 40;
      const pz = (Math.random() - 0.5) * 500;
      cloudGroup.position.set(px, py, pz);

      // Assemble 3-5 blocky puffy slabs
      const pieces = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < pieces; j++) {
        const w = 15 + Math.random() * 20;
        const h = 4 + Math.random() * 4;
        const d = 12 + Math.random() * 15;
        const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cloudMat);
        block.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 15
        );
        cloudGroup.add(block);
      }
      this.clouds.add(cloudGroup);
    }
    this.scene.add(this.clouds);
  }

  public update(dt: number) {
    // Slowly drift clouds across sky
    this.clouds.children.forEach((cloud) => {
      cloud.position.x += 1.5 * dt;
      if (cloud.position.x > 280) {
        cloud.position.x = -280;
      }
    });
  }

  public setDisasterAtmosphere(type: string) {
    if (type === 'meteor_shower') {
      this.scene.fog = new THREE.Fog(0x450a0a, 60, 240);
      this.scene.background = new THREE.Color(0x450a0a);
      this.dirLight.color.set(0xf87171);
      this.dirLight.intensity = 1.0;
      this.hemiLight.color.set(0x7f1d1d);
      this.hemiLight.groundColor.set(0x18181b);
    } else if (type === 'acid_rain') {
      this.scene.fog = new THREE.Fog(0x14532d, 50, 200);
      this.scene.background = new THREE.Color(0x14532d);
      this.dirLight.color.set(0x86efac);
      this.dirLight.intensity = 0.8;
      this.hemiLight.color.set(0x22c55e);
    } else if (type === 'rising_lava') {
      this.scene.fog = new THREE.Fog(0x7c2d12, 60, 220);
      this.scene.background = new THREE.Color(0x7c2d12);
      this.dirLight.color.set(0xfb923c);
      this.dirLight.intensity = 1.2;
    } else if (type === 'tornado') {
      this.scene.fog = new THREE.Fog(0x334155, 40, 180);
      this.scene.background = new THREE.Color(0x334155);
      this.dirLight.color.set(0x94a3b8);
      this.dirLight.intensity = 0.6;
    } else {
      // Normal sunny Roblox day
      this.scene.fog = new THREE.Fog(0x87ceeb, 100, 350);
      this.scene.background = new THREE.Color(0x87ceeb);
      this.dirLight.color.set(0xfff6dd);
      this.dirLight.intensity = 1.4;
      this.hemiLight.color.set(0xb1e1ff);
      this.hemiLight.groundColor.set(0x3b822e);
    }
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Cache generated textures so we don't recreate them repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates the classic Roblox cylindrical Lego stud bump/albedo texture
 */
export function createStudTexture(): THREE.CanvasTexture {
  const key = 'stud_texture';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Neutral background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  // Draw 2x2 studs
  const studCenters = [
    { x: 32, y: 32 },
    { x: 96, y: 32 },
    { x: 32, y: 96 },
    { x: 96, y: 96 },
  ];

  studCenters.forEach(({ x, y }) => {
    // Drop shadow
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();

    // Outer stud rim
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();

    // Top highlight rim
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#f8f8f8';
    ctx.fill();

    // Inner stud inset
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Inner concentric ring
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#eeeeee';
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Classic Roblox Green / Dark Checkered Baseplate
 */
export function createBaseplateTexture(): THREE.CanvasTexture {
  const key = 'baseplate_texture';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#489434'; // Classic Roblox Grass Green
  ctx.fillRect(0, 0, 256, 256);

  // Checker tiles
  ctx.fillStyle = '#3f822e';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillRect(128, 128, 128, 128);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeRect(0, 0, 128, 128);
  ctx.strokeRect(128, 128, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Classic Roblox Avatar Face Decals
 */
export function createFaceTexture(faceType: 'smile' | 'epic' | 'chill' | 'sunglasses' | 'derp'): THREE.CanvasTexture {
  const key = `face_${faceType}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, 256, 256);

  if (faceType === 'smile') {
    // Classic Roblox Smile: 2 black dot eyes, simple arc smile
    ctx.fillStyle = '#111111';
    // Left eye
    ctx.beginPath();
    ctx.ellipse(85, 95, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(171, 95, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile arc
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 130, 48, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();

  } else if (faceType === 'epic') {
    // Epic Face: Raised eyebrow, mischievous grin with white teeth
    ctx.fillStyle = '#111111';
    // Left eye (open circle)
    ctx.beginPath();
    ctx.ellipse(80, 105, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 100, 6, 0, Math.PI * 2);
    ctx.fill();

    // Right wink / half-closed eye
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(150, 110);
    ctx.lineTo(185, 110);
    ctx.stroke();

    // Raised left eyebrow
    ctx.beginPath();
    ctx.moveTo(60, 75);
    ctx.quadraticCurveTo(80, 60, 105, 75);
    ctx.stroke();

    // Smirking open mouth with teeth
    ctx.beginPath();
    ctx.moveTo(70, 155);
    ctx.quadraticCurveTo(135, 215, 195, 145);
    ctx.lineTo(70, 155);
    ctx.fillStyle = '#991111';
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Teeth bar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.rect(90, 155, 75, 12);
    ctx.fill();

  } else if (faceType === 'chill') {
    // Chill face: Half-closed relaxed eyelids
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';

    // Left chill eyelid
    ctx.beginPath();
    ctx.arc(85, 110, 18, Math.PI, 0);
    ctx.stroke();

    // Right chill eyelid
    ctx.beginPath();
    ctx.arc(171, 110, 18, Math.PI, 0);
    ctx.stroke();

    // Relaxed smile
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 145, 38, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

  } else if (faceType === 'sunglasses') {
    // Cool Guy Aviators
    ctx.fillStyle = '#111111';
    // Left lens
    ctx.beginPath();
    ctx.roundRect(50, 80, 65, 50, [10, 10, 25, 25]);
    ctx.fill();
    // Right lens
    ctx.beginPath();
    ctx.roundRect(141, 80, 65, 50, [10, 10, 25, 25]);
    ctx.fill();

    // Bridge
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(115, 95);
    ctx.lineTo(141, 95);
    ctx.stroke();

    // White shine gleam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 90);
    ctx.lineTo(85, 115);
    ctx.moveTo(150, 90);
    ctx.lineTo(175, 115);
    ctx.stroke();

    // Confident smirk
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(95, 170);
    ctx.quadraticCurveTo(135, 185, 175, 160);
    ctx.stroke();

  } else if (faceType === 'derp') {
    // Goofy eyes pointing different directions and sticking out tongue
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(75, 90, 18, 0, Math.PI * 2); // left eye looking left
    ctx.arc(180, 105, 14, 0, Math.PI * 2); // right eye looking down
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(70, 88, 6, 0, Math.PI * 2);
    ctx.arc(182, 108, 5, 0, Math.PI * 2);
    ctx.fill();

    // Open mouth
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(128, 155, 28, 0, Math.PI);
    ctx.fill();

    // Pink tongue sticking out
    ctx.fillStyle = '#ff6b8b';
    ctx.beginPath();
    ctx.ellipse(128, 175, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Shirt decal applied to Torso front
 */
export function createShirtTexture(pattern: string): THREE.CanvasTexture {
  const key = `shirt_${pattern}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  if (pattern === 'classic_roblox') {
    // Classic red tilted Roblox "R" square logo in chest center
    ctx.save();
    ctx.translate(128, 110);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#e52521';
    ctx.fillRect(-45, -45, 90, 90);
    // Cutout square
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-15, -15, 30, 30);
    ctx.restore();

    // Collar seam
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 15, 45, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

  } else if (pattern === 'builder_vest') {
    // Safety orange reflective stripes
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(0, 0, 256, 256);

    // Silver reflective chevron straps
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(40, 0, 30, 256);
    ctx.fillRect(186, 0, 30, 256);
    ctx.fillRect(0, 160, 256, 30);

    // Builder badge
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.roundRect(85, 90, 86, 50, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUILD', 128, 122);

  } else if (pattern === 'cyber_neon') {
    // Dark carbon with glowing neon cyan circuit lines
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(128, 40);
    ctx.lineTo(128, 120);
    ctx.lineTo(60, 160);
    ctx.moveTo(128, 120);
    ctx.lineTo(196, 160);
    ctx.stroke();

    // Central core reactor
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(128, 80, 16, 0, Math.PI * 2);
    ctx.fill();

  } else if (pattern === 'tuxedo') {
    // Formal black tuxedo with white shirt & red bowtie
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 256, 256);

    // White shirt V-neck
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(70, 0);
    ctx.lineTo(186, 0);
    ctx.lineTo(128, 170);
    ctx.closePath();
    ctx.fill();

    // Red bowtie
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(100, 35);
    ctx.lineTo(156, 55);
    ctx.lineTo(156, 35);
    ctx.lineTo(100, 55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(128, 45, 8, 0, Math.PI * 2);
    ctx.fill();

    // Shirt buttons
    ctx.fillStyle = '#111111';
    [90, 120, 150].forEach((by) => {
      ctx.beginPath();
      ctx.arc(128, by, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Bloxy Cola can texture wrap
 */
export function createBloxyColaTexture(): THREE.CanvasTexture {
  const key = 'bloxy_cola_wrap';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Crimson red can
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(0, 0, 256, 128);

  // White dynamic wave
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.bezierCurveTo(70, 40, 140, 90, 256, 50);
  ctx.lineTo(256, 85);
  ctx.bezierCurveTo(140, 115, 70, 65, 0, 85);
  ctx.closePath();
  ctx.fill();

  // "BLOXY" logo text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BLOXY', 128, 62);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('★ COLA ★', 128, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

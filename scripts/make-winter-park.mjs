/**
 * Generates a winter park background from ui/park.png:
 * - Grass → snow (white/light blue)
 * - Tree leaves → bare/icy (gray-brown)
 * - Sky → cold pale blue-gray
 * - Applies overall cool tint
 * Output: assets/backgrounds/bg_winter_park.png
 */

import { Jimp } from 'jimp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const src = join(root, 'ui/park.png');
const dst = join(root, 'assets/backgrounds/bg_winter_park.png');

const image = await Jimp.read(src);
const { width, height, data } = image.bitmap;

for (let i = 0; i < data.length; i += 4) {
  let r = data[i];
  let g = data[i + 1];
  let b = data[i + 2];

  // Detect sky (blue-dominant, bright)
  const isSky = b > r && b > g && r > 140 && g > 160 && b > 180;

  // Detect grass (green-dominant, mid brightness)
  const isGrass = g > r && g > b && g > 100 && r < 200 && b < 160;

  // Detect tree leaves (green but darker than sky, richer green)
  const isLeaf = g > r && g > b && g > 80 && g < 200 && r < 160;

  // Detect flowers (bright saturated red/yellow/pink)
  const isFlower = (r > 180 && g < 120 && b < 120) ||  // red
                   (r > 200 && g > 180 && b < 100);     // yellow

  if (isSky) {
    // Cold pale blue-gray sky
    data[i]     = Math.min(255, Math.round(r * 0.75 + 30));  // less red
    data[i + 1] = Math.min(255, Math.round(g * 0.82 + 20));  // less green
    data[i + 2] = Math.min(255, Math.round(b * 0.95 + 20));  // keep blue
  } else if (isGrass) {
    // Snow: bright white with slight blue tint
    data[i]     = 230;
    data[i + 1] = 238;
    data[i + 2] = 248;
  } else if (isLeaf) {
    // Bare tree branches: gray-brown
    const avg = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
    data[i]     = Math.min(255, avg + 20);
    data[i + 1] = Math.min(255, avg + 10);
    data[i + 2] = Math.min(255, avg + 5);
  } else if (isFlower) {
    // Cover flowers with snow
    data[i]     = 230;
    data[i + 1] = 238;
    data[i + 2] = 248;
  } else {
    // Everything else: apply a gentle cold blue tint
    data[i]     = Math.max(0, Math.round(r * 0.90));
    data[i + 1] = Math.max(0, Math.round(g * 0.92));
    data[i + 2] = Math.min(255, Math.round(b * 1.05 + 8));
  }
}

await image.write(dst);
console.log('✓ assets/backgrounds/bg_winter_park.png');

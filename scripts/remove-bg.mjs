// Removes white backgrounds from all PNGs in ui/dog, ui/cat, ui/bird
// using an edge-seeded flood-fill ("magic wand from corners") approach.
import { Jimp } from 'jimp';
import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, relative } from 'path';

const BASE = new URL('../', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const THRESHOLD = 228; // pixels with R,G,B all >= this are treated as background

function isNearWhite(color, t) {
  const r = (color >>> 24) & 0xff;
  const g = (color >>> 16) & 0xff;
  const b = (color >>> 8) & 0xff;
  return r >= t && g >= t && b >= t;
}

async function removeBg(filePath) {
  const img = await Jimp.read(filePath);
  const { width, height } = img.bitmap;
  const visited = new Uint8Array(width * height);
  const queue = [];

  function seed(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    if (isNearWhite(img.getPixelColor(x, y), THRESHOLD)) {
      visited[idx] = 1;
      queue.push(x, y);
    }
  }

  // Seed from all four edges
  for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
  for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }

  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++];
    const y = queue[qi++];
    img.setPixelColor(0x00000000, x, y);
    seed(x + 1, y); seed(x - 1, y); seed(x, y + 1); seed(x, y - 1);
  }

  // Second pass: soften remaining near-white fringe pixels adjacent to transparent
  const FRINGE = 210;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = img.getPixelColor(x, y);
      const a = c & 0xff;
      if (a === 0) continue;
      if (!isNearWhite(c, FRINGE)) continue;
      const neighbors = [
        img.getPixelColor(Math.max(0, x-1), y),
        img.getPixelColor(Math.min(width-1, x+1), y),
        img.getPixelColor(x, Math.max(0, y-1)),
        img.getPixelColor(x, Math.min(height-1, y+1)),
      ];
      const hasTransparentNeighbor = neighbors.some(n => (n & 0xff) === 0);
      if (hasTransparentNeighbor) {
        const r = (c >>> 24) & 0xff;
        const g = (c >>> 16) & 0xff;
        const b = (c >>> 8) & 0xff;
        const brightness = (r + g + b) / 3;
        const newAlpha = Math.round(((255 - brightness) / (255 - FRINGE)) * 255);
        const newColor = (r << 24) | (g << 16) | (b << 8) | Math.max(0, Math.min(255, newAlpha));
        img.setPixelColor(newColor >>> 0, x, y);
      }
    }
  }

  await img.write(filePath);
}

function findPNGs(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...findPNGs(full));
    else if (entry.toLowerCase().endsWith('.png')) results.push(full);
  }
  return results;
}

const ANIMAL_DIRS = ['ui/dog', 'ui/cat', 'ui/bird'];

for (const d of ANIMAL_DIRS) {
  const files = findPNGs(join(BASE, d));
  console.log(`\n[${d}] ${files.length} files`);
  for (const f of files) {
    try {
      await removeBg(f);
      console.log('  ✓', relative(BASE, f));
    } catch (e) {
      console.error('  ✗', relative(BASE, f), e.message);
    }
  }
}

// Copy standing-still images (now with transparent bg) into assets/
const COPIES = [
  ['ui/dog/stitch_dynamic_dog_animations/a_cute_friendly_cartoon_golden_retriever_dog_standing_still_clean_2d_vector/screen.png', 'assets/pet_dog.png'],
  ['ui/cat/stitch_dynamic_dog_animations/a_cute_friendly_cartoon_ginger_tabby_cat_standing_still_side_profile_view/screen.png', 'assets/pet_cat.png'],
  ['ui/bird/a_cute_friendly_cartoon_blue_bird_standing_still_exactly_like_data_image_image/screen.png', 'assets/pet_bird.png'],
];

for (const [src, dst] of COPIES) {
  copyFileSync(join(BASE, src), join(BASE, dst));
  console.log(`\nCopied → ${dst}`);
}

console.log('\nAll done.');

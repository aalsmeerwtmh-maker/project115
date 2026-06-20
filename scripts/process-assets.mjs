/**
 * Asset processing script:
 * 1. Removes white background from clothes images
 * 2. Saves processed PNGs to assets/clothes/
 * 3. Copies park background to assets/backgrounds/
 * 4. Copies 3D clothes GLBs to assets/ar/models/
 *
 * Run: node scripts/process-assets.mjs
 */

import { Jimp } from 'jimp';
import { copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Step 1: Remove white background from clothes images
// ---------------------------------------------------------------------------

const clothesMappings = [
  // DOG
  {
    src: 'ui/dog clothes/a_cute_friendly_cartoon_golden_retriever_dog_standing_still_wearing_a_bright/screen.png',
    dst: 'assets/clothes/pet_dog_hat.png',
  },
  {
    src: 'ui/dog clothes/a_cute_friendly_cartoon_golden_retriever_dog_standing_still_wearing_a/screen.png',
    dst: 'assets/clothes/pet_dog_suit.png',
  },
  {
    src: 'ui/dog clothes/a_cute_friendly_cartoon_golden_retriever_dog_standing_still_wearing_both_a/screen.png',
    dst: 'assets/clothes/pet_dog_hat_suit.png',
  },
  // CAT
  {
    src: 'ui/cat clothes/a_cute_friendly_cartoon_ginger_tabby_cat_standing_still_in_a_side_profile_view_2/screen.png',
    dst: 'assets/clothes/pet_cat_hat.png',
  },
  {
    src: 'ui/cat clothes/a_cute_friendly_cartoon_ginger_tabby_cat_standing_still_in_a_side_profile_view_3/screen.png',
    dst: 'assets/clothes/pet_cat_suit.png',
  },
  {
    src: 'ui/cat clothes/a_cute_friendly_cartoon_ginger_tabby_cat_standing_still_in_a_side_profile_view_1/screen.png',
    dst: 'assets/clothes/pet_cat_hat_suit.png',
  },
  // BIRD
  {
    src: 'ui/bird clothes/a_cute_friendly_cartoon_blue_bird_standing_still_wearing_a_vibrant_red_beanie/screen.png',
    dst: 'assets/clothes/pet_bird_hat.png',
  },
  {
    src: 'ui/bird clothes/a_cute_friendly_cartoon_blue_bird_standing_still_wearing_a_professional_black/screen.png',
    dst: 'assets/clothes/pet_bird_suit.png',
  },
  {
    src: 'ui/bird clothes/a_cute_friendly_cartoon_blue_bird_standing_still_wearing_both_a_vibrant_red/screen.png',
    dst: 'assets/clothes/pet_bird_hat_suit.png',
  },
];

async function removeWhiteBackground(srcPath, dstPath) {
  const image = await Jimp.read(srcPath);
  const { width, height, data } = image.bitmap;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Compute distance from pure white in RGB space
      const dr = 255 - r;
      const dg = 255 - g;
      const db = 255 - b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      // Full white (dist=0) → alpha 0; scale up quickly for non-white pixels
      // Threshold: pixels within dist 30 from white become transparent
      // Between 30 and 60: partial transparency for anti-aliased edges
      const THRESH_LOW = 30;
      const THRESH_HIGH = 60;

      if (dist < THRESH_LOW) {
        data[idx + 3] = 0;
      } else if (dist < THRESH_HIGH) {
        data[idx + 3] = Math.round(((dist - THRESH_LOW) / (THRESH_HIGH - THRESH_LOW)) * 255);
      }
      // else: keep original alpha (opaque)
    }
  }

  await image.write(dstPath);
  console.log(`✓ ${dstPath}`);
}

mkdirSync(join(root, 'assets/clothes'), { recursive: true });

console.log('\n--- Processing clothes images (removing white background) ---');
for (const { src, dst } of clothesMappings) {
  await removeWhiteBackground(join(root, src), join(root, dst));
}

// ---------------------------------------------------------------------------
// Step 2: Copy park background
// ---------------------------------------------------------------------------

mkdirSync(join(root, 'assets/backgrounds'), { recursive: true });

console.log('\n--- Copying backgrounds ---');
copyFileSync(join(root, 'ui/park.png'), join(root, 'assets/backgrounds/bg_park.png'));
console.log('✓ assets/backgrounds/bg_park.png');

// Winter park has no real asset yet — keep existing placeholder
console.log('  (bg_winter_park.png: placeholder retained — art pending)');

// ---------------------------------------------------------------------------
// Step 3: Copy 3D clothes GLBs to assets/ar/models/
// ---------------------------------------------------------------------------

const glbMappings = [
  // DOG
  {
    src: 'ui/3D clothes/Meshy_AI_Dog_Beanie_0619192759_texture.glb',
    dst: 'assets/ar/models/pet_dog_hat_stand.glb',
  },
  {
    src: 'ui/3D clothes/Meshy_AI_Dog_Suit_0619193426_texture.glb',
    dst: 'assets/ar/models/pet_dog_suit_stand.glb',
  },
  {
    src: 'ui/3D clothes/Meshy_AI_Dog_Beanie_Suit_0619193254_texture.glb',
    dst: 'assets/ar/models/pet_dog_hat_suit_stand.glb',
  },
  // CAT
  {
    src: 'ui/3D clothes/Meshy_AI_Cat_Beanie_0619195523_texture.glb',
    dst: 'assets/ar/models/pet_cat_hat_stand.glb',
  },
  {
    src: 'ui/3D clothes/Meshy_AI_Cat_Suit_0619195940_texture.glb',
    dst: 'assets/ar/models/pet_cat_suit_stand.glb',
  },
  {
    src: 'ui/3D clothes/Meshy_AI_Cat_Beanie_Suit_0619195153_texture.glb',
    dst: 'assets/ar/models/pet_cat_hat_suit_stand.glb',
  },
  // BIRD
  {
    src: 'ui/3D clothes/Meshy_AI_Bird_Beanie_0619194331_texture.glb',
    dst: 'assets/ar/models/pet_bird_hat_stand.glb',
  },
  {
    src: 'ui/3D clothes/Meshy_AI_Bird_Suit_0619193956_texture.glb',
    dst: 'assets/ar/models/pet_bird_suit_stand.glb',
  },
  {
    src: 'ui/3D clothes/Meshy_AI_Bird_Beanie_Suit_0619194704_texture.glb',
    dst: 'assets/ar/models/pet_bird_hat_suit_stand.glb',
  },
];

console.log('\n--- Copying 3D clothes models ---');
for (const { src, dst } of glbMappings) {
  copyFileSync(join(root, src), join(root, dst));
  console.log(`✓ ${dst}`);
}

console.log('\nDone! All assets processed.\n');

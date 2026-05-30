# Assets

This guide is for the art team. It describes every asset the app needs, the exact specifications for each file, and step-by-step instructions for wiring new assets into the codebase.

Do not generate or source assets from any automated tool. All art must be human-authored by the team.

---

## Section 1 — Asset checklist

### App icons and splash

| File | Dimensions | Format | Notes |
|---|---|---|---|
| `assets/icon.png` | 1024 × 1024 px | PNG, no alpha channel | Used on iOS and Android. Square, no rounded corners — the OS applies the mask. |
| `assets/splash-icon.png` | 200 × 200 px | PNG | Centered logo on the splash screen background. Background color is `#FDF8E8` (cream). |
| `assets/android-icon-foreground.png` | 1024 × 1024 px | PNG with alpha | Android adaptive icon foreground layer. Keep meaningful content within the center 66% (approximately 680 × 680 px safe zone). |
| `assets/android-icon-background.png` | 1024 × 1024 px | PNG | Solid background color layer for Android adaptive icon. Current color: `#FDF8E8`. |
| `assets/android-icon-monochrome.png` | 96 × 96 px | PNG, white on transparent | Android 13+ themed/monochrome icon. Single-color white artwork on a transparent background. |

Replace the file in place — keep the exact filename. EAS Build picks up the new image automatically on the next build.

### AR assets

| File | Format | Notes |
|---|---|---|
| `assets/ar/pet.glb` | GLB (binary glTF) | 3D pet model. Y-up coordinate system. Target scale ~0.2 m height. Must include an animation named `"idle"` (looping idle pose). `.fbx` and `.obj` are not supported — convert to GLB using Blender or a glTF converter. **Does not exist yet — this is the primary art blocker.** |
| `assets/ar/markers/placeholder_alpha.png` | PNG | Replace with the real marker image. Physical print width: 20 cm. See Section 4 for wiring details. |
| `assets/ar/markers/placeholder_beta.png` | PNG | Replace with the real marker image. Physical print width: 20 cm. |
| `assets/ar/markers/placeholder_gamma.png` | PNG | Replace with the real marker image. Physical print width: 20 cm. |

### Equipment sprites

Place sprite images in `assets/equipment/`. The filenames must match the `assetKey` values in `GAME_CONFIG.equipment` (`src/game/config.ts`).

| Asset key | Filename | Category |
|---|---|---|
| `hat_beanie` | `assets/equipment/hat_beanie.png` | Hat |
| `hat_crown` | `assets/equipment/hat_crown.png` | Hat |
| `hat_tophat` | `assets/equipment/hat_tophat.png` | Hat |
| `acc_bowtie` | `assets/equipment/acc_bowtie.png` | Accessory |
| `acc_scarf` | `assets/equipment/acc_scarf.png` | Accessory |
| `bg_forest` | `assets/equipment/bg_forest.png` | Background |
| `bg_citynight` | `assets/equipment/bg_citynight.png` | Background |

Recommended size: 256 × 256 px, PNG with transparency. Background items can be rectangular (e.g. 512 × 256 px) to match the card aspect ratio in the shop.

---

## Section 2 — Wiring up the pet 3D model

When `assets/ar/pet.glb` is delivered:

**Step 1.** In `src/ar/arResources.ts`, uncomment the `PET_MODEL_PATH` export:

```ts
// Before:
// export const PET_MODEL_PATH = require('../../assets/ar/pet.glb');

// After:
export const PET_MODEL_PATH = require('../../assets/ar/pet.glb');
```

**Step 2.** In `src/ar/PetARScene.tsx`, replace the `<ViroSphere>` placeholder with `<Viro3DObject>`. The comment in the file shows exactly what to write:

```tsx
// Remove the entire <ViroSphere> block:
<ViroSphere
  position={[0, 0.1, 0]}
  radius={0.1}
  materials={['petPlaceholder']}
  animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: true }}
/>

// Replace with:
import { Viro3DObject } from '@reactvision/react-viro';
import { PET_MODEL_PATH, IDLE_ANIMATION_NAME } from './arResources';

<Viro3DObject
  source={PET_MODEL_PATH}
  position={[0, 0, 0]}
  scale={[0.2, 0.2, 0.2]}
  type="GLB"
  animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: true }}
/>
```

The `IDLE_ANIMATION_NAME` constant (`'petIdlePulse'`) references the pulse animation registered in `arResources.ts`. If the 3D model ships with its own `"idle"` animation track, you can use that name directly on the `Viro3DObject`'s `animation.name` prop instead.

**Step 3.** Rebuild the dev client:

```bash
eas build --profile development --platform android
# or --platform ios
```

AR scenes use native libraries that do not hot-reload. A new dev client build is required whenever `arResources.ts` changes.

---

## Section 3 — Wiring up equipment images

When equipment sprite files are placed in `assets/equipment/`:

**Step 1.** Open `src/screens/shop/components/ShopItemCard.tsx`.

**Step 2.** Add an `assetKey` → `require()` lookup map at the top of the file. Example:

```ts
const EQUIPMENT_IMAGES: Record<string, ReturnType<typeof require>> = {
  hat_beanie: require('../../../../assets/equipment/hat_beanie.png'),
  hat_crown: require('../../../../assets/equipment/hat_crown.png'),
  hat_tophat: require('../../../../assets/equipment/hat_tophat.png'),
  acc_bowtie: require('../../../../assets/equipment/acc_bowtie.png'),
  acc_scarf: require('../../../../assets/equipment/acc_scarf.png'),
  bg_forest: require('../../../../assets/equipment/bg_forest.png'),
  bg_citynight: require('../../../../assets/equipment/bg_citynight.png'),
};
```

**Step 3.** In the `ShopItemCard` component, replace the placeholder view with an `<Image>` component:

```tsx
import { Image } from 'expo-image';

// Replace the placeholder:
const imageSource = EQUIPMENT_IMAGES[item.assetKey];
{imageSource ? (
  <Image source={imageSource} style={styles.itemImage} contentFit="contain" />
) : (
  <View style={styles.imagePlaceholder} />
)}
```

No rebuild is needed — image assets are bundled by Metro at JS reload time.

---

## Section 4 — Wiring up real AR image markers

The three AR image markers (`markerAlpha`, `markerBeta`, `markerGamma`) currently point to placeholder PNG files. When real marker images are ready:

**Step 1.** Replace the PNG files in place:
- `assets/ar/markers/placeholder_alpha.png` → your real marker image (keep the filename)
- `assets/ar/markers/placeholder_beta.png` → your real marker image
- `assets/ar/markers/placeholder_gamma.png` → your real marker image

**Step 2.** If the physical print width of the markers differs from the current 20 cm, update `physicalWidth` in `src/ar/arResources.ts`:

```ts
ViroARTrackingTargets.createTargets({
  markerAlpha: {
    source: require('../../assets/ar/markers/placeholder_alpha.png'),
    orientation: 'Up',
    physicalWidth: 0.2,  // ← change this value (in metres) to match the printed size
  },
  // ... markerBeta and markerGamma similarly
});
```

ARCore and ARKit use `physicalWidth` to estimate distance when the marker is detected. An incorrect value causes the AR scene to appear at the wrong scale relative to the real world.

**Step 3.** Clear the Metro cache after changing image files in `assets/ar/`:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=100.69.13.58 npx expo start -c --dev-client
```

A full dev client rebuild is not required for image asset replacements (only for native code changes), but a cache clear ensures Metro picks up the new files immediately.

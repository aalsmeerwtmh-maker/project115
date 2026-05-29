/**
 * AR asset constants and animation registration for PawStep.
 *
 * PLACEHOLDER NOTE: assets/ar/pet.glb does not exist yet. The pet model path
 * is declared here as a comment so it is easy to wire up once the art team
 * delivers the file. Until then, PetARScene.tsx uses a ViroSphere as a stand-in.
 * Do NOT generate or source any art — all 3-D assets are human-authored by the team.
 *
 * When the model arrives, uncomment PET_MODEL_PATH below and update PetARScene.tsx
 * to use Viro3DObject instead of ViroSphere.
 */
import { ViroAnimations } from '@reactvision/react-viro';

// ---------------------------------------------------------------------------
// Asset path constants
// ---------------------------------------------------------------------------

/**
 * PLACEHOLDER — assets/ar/pet.glb is not yet provided by the art team.
 * Uncomment the line below once the model file is placed in assets/ar/.
 *
 * export const PET_MODEL_PATH = require('../../assets/ar/pet.glb');
 */

// ---------------------------------------------------------------------------
// Animation registration
// ---------------------------------------------------------------------------

/**
 * Idle pulse: the pet subtly scales up and back to draw the user's eye.
 *
 * Expressed as an inline two-step chain (scale up → scale back), registered
 * under the single key 'petIdlePulse'. ViroAnimationDict accepts arrays of
 * ViroRegisterableAnimation as sequence chains.
 *
 * Registered once at module import time; subsequent calls with the same key
 * are safe — Viro ignores duplicates.
 */
ViroAnimations.registerAnimations({
  petIdlePulse: [
    // Scale up — 0.5 s
    {
      duration: 500,
      easing: 'EaseInEaseOut',
      properties: { scaleX: 1.05, scaleY: 1.05, scaleZ: 1.05 },
    },
    // Scale back — 0.5 s
    {
      duration: 500,
      easing: 'EaseInEaseOut',
      properties: { scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0 },
    },
  ],
});

/**
 * Animation name to pass to ViroAnimatedComponent's `animation` prop.
 * Usage: animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: true }}
 */
export const IDLE_ANIMATION_NAME = 'petIdlePulse';

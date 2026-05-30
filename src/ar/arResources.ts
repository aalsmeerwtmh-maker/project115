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
import { ViroAnimations, ViroMaterials, ViroARTrackingTargets } from '@reactvision/react-viro';

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

// Orange material for the placeholder sphere so it is clearly visible.
ViroMaterials.createMaterials({
  petPlaceholder: {
    lightingModel: 'Blinn',
    diffuseColor: '#F5A623',
  },
});

// ---------------------------------------------------------------------------
// Image marker registration
//
// PLACEHOLDER — replace placeholder_*.png with real team-authored images before demo.
// ViroARTrackingTargets.createTargets runs at module load time, the same as
// ViroAnimations.registerAnimations above — safe to call multiple times with
// the same keys (Viro ignores duplicates).
// ---------------------------------------------------------------------------

export const IMAGE_MARKER_TOKEN_REWARD = 25;

ViroARTrackingTargets.createTargets({
  // PLACEHOLDER — replace with real team-authored image asset before demo.
  markerAlpha: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../../assets/ar/markers/placeholder_alpha.png'),
    orientation: 'Up',
    physicalWidth: 0.2, // 20 cm physical width
  },
  // PLACEHOLDER — replace with real team-authored image asset before demo.
  markerBeta: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../../assets/ar/markers/placeholder_beta.png'),
    orientation: 'Up',
    physicalWidth: 0.2,
  },
  // PLACEHOLDER — replace with real team-authored image asset before demo.
  markerGamma: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../../assets/ar/markers/placeholder_gamma.png'),
    orientation: 'Up',
    physicalWidth: 0.2,
  },
});

export const IMAGE_MARKER_NAMES = ['markerAlpha', 'markerBeta', 'markerGamma'] as const;
export type ImageMarkerName = (typeof IMAGE_MARKER_NAMES)[number];

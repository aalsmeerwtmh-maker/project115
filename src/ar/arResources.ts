import { Platform } from 'react-native';
import { ViroAnimations, ViroMaterials, ViroARTrackingTargets } from '@reactvision/react-viro';

// ---------------------------------------------------------------------------
// 3D model registry — one entry per species, one field per display mood.
// walk and excited hold tuples for frame-cycling animation.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Src = any; // Metro require() returns a number; typed loosely so Viro accepts it

export interface PetARMoodModels {
  stand:    Src;
  sleeping: Src;
  eating:   Src;
  walk:     readonly Src[]; // 2 or 3 frames depending on species
  excited:  readonly Src[];
  happy:    readonly Src[];
}

export const PET_AR_MODELS: Record<string, PetARMoodModels> = {
  dog: {
    stand:    require('../../assets/ar/models/pet_dog_stand.glb'),
    sleeping: require('../../assets/ar/models/pet_dog_sleep.glb'),
    eating:   require('../../assets/ar/models/pet_dog_eat.glb'),
    // 3 run frames used for walk — smoother than the 2-frame walk cycle.
    walk: [
      require('../../assets/ar/models/pet_dog_run_1.glb'),
      require('../../assets/ar/models/pet_dog_run_2.glb'),
      require('../../assets/ar/models/pet_dog_run_3.glb'),
    ],
    excited: [
      require('../../assets/ar/models/pet_dog_run_1.glb'),
      require('../../assets/ar/models/pet_dog_run_2.glb'),
      require('../../assets/ar/models/pet_dog_run_3.glb'),
    ],
    happy: [require('../../assets/ar/models/pet_dog_stand.glb')],
  },

  cat: {
    stand:    require('../../assets/ar/models/pet_cat_stand.glb'),
    sleeping: require('../../assets/ar/models/pet_cat_sleep.glb'),
    eating:   require('../../assets/ar/models/pet_cat_eat.glb'),
    walk: [
      require('../../assets/ar/models/pet_cat_walk_1.glb'),
      require('../../assets/ar/models/pet_cat_walk_2.glb'),
    ],
    excited: [require('../../assets/ar/models/pet_cat_wool.glb')],
    happy: [
      require('../../assets/ar/models/pet_cat_lick_1.glb'),
      require('../../assets/ar/models/pet_cat_lick_2.glb'),
    ],
  },

  bird: {
    stand:    require('../../assets/ar/models/pet_bird_stand.glb'),
    sleeping: require('../../assets/ar/models/pet_bird_sleep.glb'),
    eating:   require('../../assets/ar/models/pet_bird_eat.glb'),
    walk: [
      require('../../assets/ar/models/pet_bird_fly_1.glb'),
      require('../../assets/ar/models/pet_bird_fly_2.glb'),
    ],
    excited: [
      require('../../assets/ar/models/pet_bird_jump_1.glb'),
      require('../../assets/ar/models/pet_bird_jump_2.glb'),
    ],
    happy: [
      require('../../assets/ar/models/pet_bird_jump_1.glb'),
      require('../../assets/ar/models/pet_bird_jump_2.glb'),
    ],
  },
};

// ---------------------------------------------------------------------------
// Animation registration
// ---------------------------------------------------------------------------

ViroAnimations.registerAnimations({
  // Gentle idle scale-pulse used on single-frame static poses (stand, sleep, eat).
  petIdlePulse: [
    { duration: 1200, easing: 'EaseInEaseOut', properties: { scaleX: 1.03, scaleY: 1.03, scaleZ: 1.03 } },
    { duration: 1200, easing: 'EaseInEaseOut', properties: { scaleX: 1.0,  scaleY: 1.0,  scaleZ: 1.0  } },
  ],
});

export const IDLE_ANIMATION_NAME = 'petIdlePulse';

// ---------------------------------------------------------------------------
// Image marker registration
// ---------------------------------------------------------------------------

export const PLANE_ALIGNMENT: 'HorizontalUpward' | 'Horizontal' = Platform.select({
  android: 'HorizontalUpward',
  default: 'Horizontal',
});

export const HIT_TEST_PRIORITY: string[] = [
  'ExistingPlaneUsingExtent',
  'ExistingPlane',
  'EstimatedHorizontalPlane',
  'FeaturePoint',
];

export const IMAGE_MARKER_TOKEN_REWARD = 25;

ViroMaterials.createMaterials({
  petPlaceholder: {
    lightingModel: 'Constant',
    diffuseColor: '#F5A623',
  },
});

ViroARTrackingTargets.createTargets({
  markerAlpha: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../../assets/ar/markers/placeholder_alpha.png'),
    orientation: 'Up',
    physicalWidth: 0.2,
  },
  markerBeta: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../../assets/ar/markers/placeholder_beta.png'),
    orientation: 'Up',
    physicalWidth: 0.2,
  },
  markerGamma: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../../assets/ar/markers/placeholder_gamma.png'),
    orientation: 'Up',
    physicalWidth: 0.2,
  },
});

export const IMAGE_MARKER_NAMES = ['markerAlpha', 'markerBeta', 'markerGamma'] as const;
export type ImageMarkerName = (typeof IMAGE_MARKER_NAMES)[number];

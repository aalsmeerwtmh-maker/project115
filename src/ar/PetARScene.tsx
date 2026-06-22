/**
 * PetARScene — Viro AR scene that places the user's 3-D pet on a detected surface.
 *
 * Behaviour:
 *  - Scans for a horizontal plane, then waits for a tap (via registerTapHandler).
 *  - Once placed, renders the pet as a Viro3DObject using the correct GLB for the
 *    active species + display mood (sleeping / eating / walking / excited / happy / normal).
 *  - Multi-frame moods (walking, excited, happy) animate by cycling through GLB frames
 *    with setInterval — same pattern as PetStateDisplay for 2-D screens.
 *  - When the user walks more than petFollowDistanceM away from the pet, the pet switches
 *    to its walking animation and steps toward the camera until within petArriveDistanceM.
 *  - Species and mood are pushed from ARWalkScreen via registerSceneUpdate (avoids the
 *    viroAppProps stale-closure problem — sceneNavigator is a class field set once).
 */
import { useEffect, useRef, useState } from 'react';
import {
  ViroARScene,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroNode,
  Viro3DObject,
} from '@reactvision/react-viro';
import type { ViroCameraARHitTest, ViroARHitTestResult } from '@reactvision/react-viro';

import { resolveARModels, IDLE_ANIMATION_NAME, HIT_TEST_PRIORITY } from './arResources';
import type { PetARMoodModels } from './arResources';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { GAME_CONFIG } from '@/game/config';
import type { DisplayMood } from '@/game/petMood';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Src = any;
type Vec3 = [number, number, number];
type PlacementStatus = 'scanning' | 'ready' | 'placing' | 'placed';
type PlacementState = { status: 'scanning' } | { status: 'ready' } | { status: 'placed'; position: Vec3 };

type ViroAppProps = {
  onPlacementStateChanged?: (status: PlacementStatus) => void;
  onPetLoaded?: () => void;
  registerTapHandler?: (fn: () => void) => void;
  registerSceneUpdate?: (fn: (species: string, mood: DisplayMood, scale: number) => void) => void;
  initialSpecies?: string;
  initialMood?: DisplayMood;
  initialScale?: number;
};

type PetARSceneProps = {
  sceneNavigator: { viroAppProps?: ViroAppProps };
};

// ---------------------------------------------------------------------------
// Frame-cycle intervals (ms) per mood
// ---------------------------------------------------------------------------

const WALK_FRAME_MS    = 300;
const EXCITED_FRAME_MS = 220;
const HAPPY_FRAME_MS   = 600;

// ---------------------------------------------------------------------------
// Config shortcuts
// ---------------------------------------------------------------------------

const FOLLOW_DIST = GAME_CONFIG.ar.petFollowDistanceM;
const ARRIVE_DIST = GAME_CONFIG.ar.petArriveDistanceM;
const STEP_M      = GAME_CONFIG.ar.petWalkStepM;
const STEP_MS     = GAME_CONFIG.ar.petWalkStepIntervalMs;

const HIT_MAX: Record<string, number> = {
  ExistingPlaneUsingExtent: GAME_CONFIG.ar.hitTestMaxDistances.existingPlaneUsingExtent,
  ExistingPlane:            GAME_CONFIG.ar.hitTestMaxDistances.existingPlane,
  EstimatedHorizontalPlane: GAME_CONFIG.ar.hitTestMaxDistances.estimatedHorizontalPlane,
  FeaturePoint:             GAME_CONFIG.ar.hitTestMaxDistances.featurePoint,
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function camDist(hit: ViroARHitTestResult, cam: Vec3): number {
  const [hx, hy, hz] = hit.transform.position;
  return Math.sqrt((hx - cam[0]) ** 2 + (hy - cam[1]) ** 2 + (hz - cam[2]) ** 2);
}

function xzDist(a: Vec3, b: Vec3): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2);
}

function pickBest(results: ViroARHitTestResult[], cam: Vec3): ViroARHitTestResult | null {
  for (const type of HIT_TEST_PRIORITY) {
    const max = HIT_MAX[type] ?? 3.0;
    for (const r of results) {
      if (r.type !== type) continue;
      if (camDist(r, cam) > max) continue;
      if (r.hasDepthData && r.depthConfidence !== undefined && r.depthConfidence < GAME_CONFIG.ar.minDepthConfidence) continue;
      return r;
    }
  }
  return null;
}

/** Returns the ordered list of GLB sources for the given model set + mood. */
function getMoodFrames(m: PetARMoodModels, mood: DisplayMood): Src[] {
  switch (mood) {
    case 'sleeping': return [m.sleeping];
    case 'eating':   return [m.eating];
    case 'walking':  return [...m.walk];
    case 'excited':  return [...m.excited];
    case 'happy':    return [...m.happy];
    default:         return [m.stand]; // normal, sad
  }
}

function frameCycleMs(mood: DisplayMood): number {
  if (mood === 'excited') return EXCITED_FRAME_MS;
  if (mood === 'happy')   return HAPPY_FRAME_MS;
  return WALK_FRAME_MS;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PetARScene({ sceneNavigator }: PetARSceneProps) {
  const arSceneRef = useRef<ViroARScene>(null);

  // ---------- Placement state ----------
  const [placement, setPlacement] = useState<PlacementState>({ status: 'scanning' });
  const placementRef = useRef(placement);
  placementRef.current = placement;

  const latestHitRef = useRef<ViroARHitTestResult | null>(null);
  const cameraRef    = useRef<Vec3>([0, 0, 0]);

  // ---------- Species / mood (pushed from ARWalkScreen via callback) ----------
  const { initialSpecies = 'dog', initialMood = 'normal', initialScale = 1 } = sceneNavigator.viroAppProps ?? {};
  const [species,  setSpecies]  = useState(initialSpecies);
  const [baseMood, setBaseMood] = useState<DisplayMood>(initialMood);
  // Uniform render scale driven by the pet's growth stage (see GAME_CONFIG.ar).
  const [petScale, setPetScale] = useState(initialScale);

  // ---------- Equipment (hat / suit) ----------
  const equipped = useEquipmentStore((s) => s.equipped);
  const hasHat  = equipped.includes('hat_cozy');
  const hasSuit = equipped.includes('suit_formal');
  const arModels = resolveARModels(species, hasHat, hasSuit);

  // Register callback so ARWalkScreen can push updates into this scene.
  useEffect(() => {
    sceneNavigator.viroAppProps?.registerSceneUpdate?.((sp, mood, scale) => {
      setSpecies(sp);
      setBaseMood(mood);
      setPetScale(scale);
    });
  // sceneNavigator is a stable Viro class ref — safe to omit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Follow logic ----------
  const [isFollowing, setIsFollowing] = useState(false);
  const isFollowingRef = useRef(false);

  // The mood shown in the AR scene: override to 'walking' while following.
  const arMood: DisplayMood = isFollowing ? 'walking' : baseMood;

  // Pet world position (starts at placed position, updates while following).
  const petPosRef = useRef<Vec3>([0, 0, 0]);
  const [petPos, setPetPos]       = useState<Vec3>([0, 0, 0]);
  const [petYRot, setPetYRot]     = useState(0);

  // Step the pet toward the camera while isFollowing is true.
  useEffect(() => {
    if (!isFollowing) return;
    const id = setInterval(() => {
      const pet = petPosRef.current;
      const cam = cameraRef.current;
      const dx = cam[0] - pet[0];
      const dz = cam[2] - pet[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < ARRIVE_DIST) {
        isFollowingRef.current = false;
        setIsFollowing(false);
        return;
      }
      const step = Math.min(STEP_M, dist - ARRIVE_DIST);
      const newPos: Vec3 = [pet[0] + (dx / dist) * step, pet[1], pet[2] + (dz / dist) * step];
      petPosRef.current = newPos;
      setPetPos(newPos);
      // Rotate pet to face the user (Y-axis rotation in degrees).
      setPetYRot(Math.atan2(dx, dz) * (180 / Math.PI));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [isFollowing]);

  // ---------- Frame animation ----------
  const [arFrame, setArFrame] = useState(0);

  useEffect(() => {
    setArFrame(0);
    const frames = getMoodFrames(arModels, arMood);
    if (frames.length <= 1) return;
    const id = setInterval(
      () => setArFrame(f => (f + 1) % frames.length),
      frameCycleMs(arMood),
    );
    return () => clearInterval(id);
  }, [arMood, species]);

  // ---------- Camera hit-test (always active) ----------

  function handleCameraHitTest(event: ViroCameraARHitTest) {
    const cam = event.cameraOrientation.position as Vec3;
    cameraRef.current = cam;

    if (placementRef.current.status !== 'placed') {
      // Pre-placement: cache the best surface hit AND reflect real surface
      // availability in the placement state. "Tap to place" (and the tap target)
      // must only appear once a tap will actually land the pet — not merely once
      // tracking initialises, which happens seconds before a surface is found.
      const best = pickBest(event.hitTestResults, cam);
      if (best) latestHitRef.current = best;
      const desired: PlacementStatus = best ? 'ready' : 'scanning';
      if (placementRef.current.status !== desired) {
        setPlacement(best ? { status: 'ready' } : { status: 'scanning' });
        sceneNavigator.viroAppProps?.onPlacementStateChanged?.(desired);
      }
    } else {
      // Post-placement: start following if the user has walked too far.
      const dist = xzDist(petPosRef.current, cam);
      if (dist > FOLLOW_DIST && !isFollowingRef.current) {
        isFollowingRef.current = true;
        setIsFollowing(true);
      }
    }
  }

  // ---------- Tap handler (registered once on mount) ----------

  useEffect(() => {
    sceneNavigator.viroAppProps?.registerTapHandler?.(() => {
      if (placementRef.current.status !== 'ready') return;
      const hit = latestHitRef.current;
      if (!hit) return;
      const pos = hit.transform.position as Vec3;
      petPosRef.current = pos;
      setPetPos(pos);
      setPlacement({ status: 'placed', position: pos });
      sceneNavigator.viroAppProps?.onPlacementStateChanged?.('placing');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Render ----------

  const frames = getMoodFrames(arModels, arMood);
  const isStatic = frames.length === 1;

  return (
    <ViroARScene
      ref={arSceneRef}
      anchorDetectionTypes={placement.status !== 'placed' ? ['planesHorizontal'] : []}
      onCameraARHitTest={handleCameraHitTest}
    >
      <ViroAmbientLight color="#FFFFFF" intensity={200} />
      <ViroDirectionalLight
        color="#FFFFFF"
        direction={[0, -1, -0.2]}
        intensity={300}
        castsShadow={false}
      />

      {placement.status === 'placed' && (
        <ViroNode
          position={petPos}
          rotation={[0, petYRot, 0]}
          scale={[petScale, petScale, petScale]}
        >
          {frames.map((src: Src, i: number) => (
            <Viro3DObject
              key={`${species}-${arMood}-${i}`}
              source={src}
              visible={i === arFrame}
              position={[0, 0, 0]}
              type="GLB"
              // Notify the screen when the first-shown frame is actually on screen so
              // the "Placing…" indicator clears only once the pet is really visible.
              onLoadEnd={i === 0 ? () => sceneNavigator.viroAppProps?.onPetLoaded?.() : undefined}
              // Idle pulse only on static single-frame moods; animated moods use frame cycling.
              animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: isStatic }}
            />
          ))}
        </ViroNode>
      )}
    </ViroARScene>
  );
}

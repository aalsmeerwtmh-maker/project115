/**
 * PetARScene — Viro AR scene that places the user's pet on a detected surface.
 *
 * PLACEHOLDER MODEL NOTE:
 * assets/ar/pet.glb does not exist yet and must NOT be generated or sourced externally —
 * all art is human-authored by the team. Until the file is delivered, a ViroSphere
 * is rendered as a stand-in. Replace the ViroSphere block with Viro3DObject once the
 * file is delivered (see comment near the ViroSphere below).
 *
 * Placement flow:
 * 1. Scene opens → status: 'scanning'
 * 2. onTrackingUpdated fires TRACKING_LIMITED or TRACKING_NORMAL → status: 'ready';
 *    ARWalkScreen shows "Tap to place your pet" and mounts the tap overlay.
 * 3. onCameraARHitTest fires every frame with hit-test results from the camera centre.
 *    The best result (filtered by type priority, camera distance, and depth confidence)
 *    is cached in latestHitRef.
 * 4. User taps → ARWalkScreen calls the registered tap handler.
 *    Handler reads latestHitRef, places the pet → calls onPlacementStateChanged('placing').
 *    ARWalkScreen shows a "Placing…" banner for placingFeedbackMs, then transitions to 'placed'.
 * 5. ViroNode renders the pet at that fixed world position — no drift.
 *
 * Distance filtering (why camera-relative, not origin-relative):
 * transform.position from onCameraARHitTest is in world space anchored to the AR
 * session origin. After the user walks a few metres the session origin is behind them —
 * sqrt(x²+y²+z²) gives distance from start, not from the camera. cameraOrientation.position
 * in the same event is the camera's current world position and is the correct reference point.
 *
 * Why ExistingPlaneUsingExtent before ExistingPlane:
 * ExistingPlane intersects the plane's infinite mathematical extension; a near-horizontal
 * ray can hit a confirmed floor plane metres away. ExistingPlaneUsingExtent only fires
 * when the intersection is inside the plane's measured polygon — much tighter.
 *
 * Why onCameraARHitTest instead of performARHitTestWithPoint:
 * performARHitTestWithPoint(x, y) consistently returns 0 results regardless of
 * coordinate system — it appears to be unreliable in this version of react-viro.
 * onCameraARHitTest is Viro's own continuous native pipeline and reliably produces
 * hit results when the camera is pointed at a real-world surface.
 *
 * Why named prop instead of arguments[0]:
 * Babel's arrow-function transform hoists `arguments` to the nearest non-arrow scope.
 * In a strict-mode module that scope has no `arguments` object — every access returns
 * undefined. Receiving sceneNavigator as a real named prop is safe in all environments.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ViroARScene,
  ViroAmbientLight,
  ViroNode,
  ViroSphere,
  ViroTrackingStateConstants,
} from '@reactvision/react-viro';
import type { ViroCameraARHitTest, ViroARHitTestResult } from '@reactvision/react-viro';

import { IDLE_ANIMATION_NAME, HIT_TEST_PRIORITY } from './arResources';
import { GAME_CONFIG } from '@/game/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlacementStatus = 'scanning' | 'ready' | 'placing' | 'placed';

type PlacementState =
  | { status: 'scanning' }
  | { status: 'ready' }
  | { status: 'placed'; position: [number, number, number] };

type ViroAppProps = {
  onPlacementStateChanged?: (status: PlacementStatus) => void;
  registerTapHandler?: (fn: () => void) => void;
};

type PetARSceneProps = {
  sceneNavigator: {
    viroAppProps?: ViroAppProps;
  };
};

// ---------------------------------------------------------------------------
// Distance filtering (module-level — computed once, not per render)
// ---------------------------------------------------------------------------

const HIT_MAX_DISTANCE: Record<string, number> = {
  ExistingPlaneUsingExtent: GAME_CONFIG.ar.hitTestMaxDistances.existingPlaneUsingExtent,
  ExistingPlane: GAME_CONFIG.ar.hitTestMaxDistances.existingPlane,
  EstimatedHorizontalPlane: GAME_CONFIG.ar.hitTestMaxDistances.estimatedHorizontalPlane,
  FeaturePoint: GAME_CONFIG.ar.hitTestMaxDistances.featurePoint,
};

function distanceFromCamera(
  hit: ViroARHitTestResult,
  camPos: [number, number, number],
): number {
  const [hx, hy, hz] = hit.transform.position;
  const [cx, cy, cz] = camPos;
  return Math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2 + (hz - cz) ** 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PetARScene({ sceneNavigator }: PetARSceneProps) {
  const arSceneRef = useRef<ViroARScene>(null);
  const [placement, setPlacement] = useState<PlacementState>({ status: 'scanning' });

  // Always-current placement state for use inside closures.
  const placementRef = useRef(placement);
  placementRef.current = placement;

  // Cache the best hit-test result from onCameraARHitTest so the tap handler
  // can use it synchronously without calling performARHitTestWithPoint.
  const latestHitRef = useRef<ViroARHitTestResult | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function pickBestResult(
    results: ViroARHitTestResult[],
    camPos: [number, number, number],
  ): ViroARHitTestResult | null {
    for (const priorityType of HIT_TEST_PRIORITY) {
      const maxDist = HIT_MAX_DISTANCE[priorityType] ?? 3.0;
      for (const r of results) {
        if (r.type !== priorityType) continue;
        if (distanceFromCamera(r, camPos) > maxDist) continue;
        if (
          r.hasDepthData &&
          r.depthConfidence !== undefined &&
          r.depthConfidence < GAME_CONFIG.ar.minDepthConfidence
        ) continue;
        return r;
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Tracking
  // ---------------------------------------------------------------------------

  function handleTrackingUpdated(state: number) {
    if (
      placementRef.current.status === 'scanning' &&
      state >= ViroTrackingStateConstants.TRACKING_LIMITED
    ) {
      setPlacement({ status: 'ready' });
      sceneNavigator.viroAppProps?.onPlacementStateChanged?.('ready');
    }
  }

  // ---------------------------------------------------------------------------
  // Continuous camera hit-test (disabled after placement)
  // ---------------------------------------------------------------------------

  function handleCameraHitTest(event: ViroCameraARHitTest) {
    const camPos = event.cameraOrientation.position as [number, number, number];
    const results = event.hitTestResults;
    if (__DEV__ && results.length > 0) {
      const summary = results.map(r => {
        const d = distanceFromCamera(r, camPos);
        return `${r.type}@${d.toFixed(2)}m conf=${r.depthConfidence ?? 'n/a'}`;
      }).join(' | ');
      console.log(`[PetARScene] cam=${JSON.stringify(camPos)} hits: ${summary}`);
    }
    const best = pickBestResult(results, camPos);
    if (best) {
      latestHitRef.current = best;
      if (__DEV__) {
        console.log(`[PetARScene] ref SET: ${best.type}@${distanceFromCamera(best, camPos).toFixed(2)}m`);
      }
    } else if (__DEV__ && results.length > 0) {
      console.log('[PetARScene] ref NOT set (all results filtered)');
    }
  }

  // ---------------------------------------------------------------------------
  // Tap handler registration (runs once on mount)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const { registerTapHandler } = sceneNavigator.viroAppProps ?? {};
    registerTapHandler?.(() => {
      if (__DEV__) {
        console.log(`[PetARScene:tap] status=${placementRef.current.status} hit=${latestHitRef.current ? latestHitRef.current.type + '@' + distanceFromCamera(latestHitRef.current, [0,0,0]).toFixed(2) : 'null'}`);
      }
      if (placementRef.current.status !== 'ready') return;
      const hit = latestHitRef.current;
      if (!hit) {
        console.warn('[PetARScene] tapped but no hit result cached yet — keep camera on surface');
        return;
      }
      const pos = hit.transform.position;
      setPlacement({ status: 'placed', position: pos });
      // 'placing' → ARWalkScreen shows feedback banner; ARWalkScreen transitions to
      // 'placed' after GAME_CONFIG.ar.placingFeedbackMs so the ViroNode has time to render.
      sceneNavigator.viroAppProps?.onPlacementStateChanged?.('placing');
    });
  // sceneNavigator is a stable reference — safe to omit from deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ViroARScene
      ref={arSceneRef}
      anchorDetectionTypes={placement.status !== 'placed' ? ['planesHorizontal'] : []}
      onTrackingUpdated={handleTrackingUpdated}
      onCameraARHitTest={placement.status !== 'placed' ? handleCameraHitTest : undefined}
    >
      <ViroAmbientLight color="#FFFFFF" intensity={200} />

      {placement.status === 'placed' && (
        <ViroNode position={placement.position}>
          {/*
           * PLACEHOLDER: replace with Viro3DObject once assets/ar/pet.glb is delivered:
           *   <Viro3DObject
           *     source={PET_MODEL_PATH}
           *     position={[0, 0, 0]}
           *     scale={[0.2, 0.2, 0.2]}
           *     type="GLB"
           *     animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: true }}
           *   />
           */}
          <ViroSphere
            position={[0, 0.1, 0]}
            radius={0.1}
            materials={['petPlaceholder']}
            animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: true }}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
}

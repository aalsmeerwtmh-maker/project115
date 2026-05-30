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
 *    The best result is cached in latestHitRef.
 * 4. User taps → ARWalkScreen calls the registered tap handler.
 *    Handler reads latestHitRef and places the pet there → status: 'placed'.
 * 5. ViroNode renders the pet at that fixed world position — no drift.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlacementStatus = 'scanning' | 'ready' | 'placed';

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

  function pickBestResult(results: ViroARHitTestResult[]): ViroARHitTestResult | null {
    for (const priorityType of HIT_TEST_PRIORITY) {
      const match = results.find((r) => r.type === priorityType);
      if (match) return match;
    }
    return results[0] ?? null;
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
    const best = pickBestResult(event.hitTestResults);
    if (best) {
      latestHitRef.current = best;
    }
  }

  // ---------------------------------------------------------------------------
  // Tap handler registration (runs once on mount)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const { registerTapHandler } = sceneNavigator.viroAppProps ?? {};
    registerTapHandler?.(() => {
      if (placementRef.current.status !== 'ready') return;
      const hit = latestHitRef.current;
      if (!hit) {
        console.warn('[PetARScene] tapped but no hit result cached yet — keep camera on surface');
        return;
      }
      const pos = hit.transform.position;
      setPlacement({ status: 'placed', position: pos });
      sceneNavigator.viroAppProps?.onPlacementStateChanged?.('placed');
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

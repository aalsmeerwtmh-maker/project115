/**
 * PetARScene — Viro AR scene that places the user's pet on a detected surface
 * via hit-test, then locks it to a fixed world position to prevent drift.
 *
 * PLACEHOLDER MODEL NOTE:
 * assets/ar/pet.glb does not exist yet and must NOT be generated or sourced externally —
 * all art is human-authored by the team. Until the file is delivered, a ViroSphere
 * is rendered as a stand-in. To switch to the real model, replace the <ViroSphere>
 * block with:
 *
 *   <Viro3DObject
 *     source={PET_MODEL_PATH}
 *     position={[0, 0, 0]}
 *     scale={[0.2, 0.2, 0.2]}
 *     type="GLB"
 *     animation={{ name: IDLE_ANIMATION_NAME, loop: true, run: true }}
 *   />
 *
 * Hit-test placement flow:
 * 1. Scene opens → status: 'scanning'
 * 2. onAnchorFound fires (ARCore found first plane) → status: 'ready'
 * 3. User taps → onClick on ViroARScene → performARHitTestWithPosition
 * 4. Highest-priority hit result → status: 'placed' with fixed world position
 * 5. ViroNode renders pet at that fixed position — not anchored to a live plane → no drift
 */
import { useRef, useState } from 'react';
import { ViroARScene, ViroAmbientLight, ViroNode, ViroSphere } from '@reactvision/react-viro';
import type { ViroAnchorFoundMap, ViroARHitTestResult } from '@reactvision/react-viro';

// Register animations, materials, and expose the animation name constant.
import { IDLE_ANIMATION_NAME, PLANE_ALIGNMENT, HIT_TEST_PRIORITY } from './arResources';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlacementState =
  | { status: 'scanning' }
  | { status: 'ready' }
  | { status: 'placed'; position: [number, number, number] };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The AR scene that shows the pet at a hit-test-placed world position.
 *
 * Exported as a zero-argument function to satisfy the ViroARSceneNavigator
 * `initialScene.scene` type, which is declared as `() => React.JSX.Element`.
 * Viro will inject navigator props at runtime regardless of the TS signature.
 */
export function PetARScene() {
  // Read viroAppProps injected at runtime by ViroARSceneNavigator.
  // Typed via `as any` since Viro injects these outside the normal prop flow.
  // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
  const { onPlacementStateChanged } = (arguments[0] as any)?.sceneNavigator?.viroAppProps ?? {};

  const arSceneRef = useRef<ViroARScene>(null);
  const [placement, setPlacement] = useState<PlacementState>({ status: 'scanning' });

  // When ARCore finds its first plane the scene is ready for placement.
  function handleAnchorFound(_anchor: ViroAnchorFoundMap) {
    if (placement.status === 'scanning') {
      setPlacement({ status: 'ready' });
      onPlacementStateChanged?.('ready');
    }
  }

  // Pick the highest-priority result from HIT_TEST_PRIORITY.
  function pickBestResult(results: ViroARHitTestResult[]): ViroARHitTestResult | null {
    for (const priorityType of HIT_TEST_PRIORITY) {
      const match = results.find((r) => r.type === priorityType);
      if (match) return match;
    }
    return results[0] ?? null;
  }

  // Called by ViroARScene when the user taps the scene.
  function handleClick(position: [number, number, number]) {
    // Once placed, further taps are no-ops.
    if (placement.status === 'placed') return;
    // Only allow placement once a plane has been found.
    if (placement.status !== 'ready') return;

    arSceneRef.current
      ?.performARHitTestWithPosition(position)
      .then((results: ViroARHitTestResult[]) => {
        const best = pickBestResult(results);
        if (!best) return;
        const pos = best.transform.position;
        setPlacement({ status: 'placed', position: pos });
        onPlacementStateChanged?.('placed');
      })
      .catch((err: unknown) => {
        console.warn('[PetARScene] performARHitTestWithPosition failed:', err);
      });
  }

  return (
    <ViroARScene
      ref={arSceneRef}
      anchorDetectionTypes={[PLANE_ALIGNMENT]}
      onAnchorFound={handleAnchorFound}
      onClick={handleClick}
    >
      {/* Global ambient light so the placeholder geometry is visible */}
      <ViroAmbientLight color="#FFFFFF" intensity={200} />

      {placement.status === 'placed' && (
        <ViroNode position={placement.position}>
          {/*
           * PLACEHOLDER pet: orange sphere with idle pulse animation.
           * ViroAnimatedComponent is avoided — it has a this-binding bug when
           * the component re-renders after plane selection.
           * Animation prop is applied directly on ViroSphere instead.
           *
           * Replace with Viro3DObject once assets/ar/pet.glb is delivered:
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

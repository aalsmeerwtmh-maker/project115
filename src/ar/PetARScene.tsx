/**
 * PetARScene — Viro AR scene that anchors the user's pet to a detected ground plane.
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
 * Plane detection wiring:
 * ViroARPlaneSelector now requires anchor events forwarded from ViroARScene via a ref
 * (breaking change in recent versions). See the ref / handleAnchor* pattern below.
 */
import { useRef } from 'react';
import {
  ViroARScene,
  ViroARPlaneSelector,
  ViroAmbientLight,
  ViroSphere,
  ViroAnimatedComponent,
} from '@reactvision/react-viro';
import type { ViroAnchor } from '@reactvision/react-viro';

// Register animations and expose the name constant.
import { IDLE_ANIMATION_NAME } from './arResources';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The AR scene that shows the pet on a detected horizontal plane.
 *
 * Exported as a zero-argument function to satisfy the ViroARSceneNavigator
 * `initialScene.scene` type, which is declared as `() => React.JSX.Element`.
 * Viro will inject navigator props at runtime regardless of the TS signature.
 */
export function PetARScene() {
  const selectorRef = useRef<ViroARPlaneSelector>(null);

  // Forward anchor lifecycle events from ViroARScene to ViroARPlaneSelector.
  function handleAnchorFound(anchor: ViroAnchor) {
    selectorRef.current?.handleAnchorFound(anchor);
  }
  function handleAnchorUpdated(anchor: ViroAnchor) {
    selectorRef.current?.handleAnchorUpdated(anchor);
  }
  function handleAnchorRemoved(anchor: ViroAnchor | undefined) {
    if (anchor) selectorRef.current?.handleAnchorRemoved(anchor);
  }

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal']}
      onAnchorFound={handleAnchorFound}
      onAnchorUpdated={handleAnchorUpdated}
      onAnchorRemoved={handleAnchorRemoved}
    >
      {/* Global ambient light so the placeholder geometry is visible */}
      <ViroAmbientLight color="#FFFFFF" intensity={200} />

      <ViroARPlaneSelector
        ref={selectorRef}
        alignment="HorizontalUpward"
        minWidth={0.3}
        minHeight={0.3}
        hideOverlayOnSelection
      >
        {/*
         * PLACEHOLDER pet representation.
         * Replace this ViroAnimatedComponent + ViroSphere block with a
         * Viro3DObject once assets/ar/pet.glb is provided by the team.
         *
         * The animated component wraps the geometry so the idle pulse
         * animation (defined in arResources.ts) runs continuously.
         */}
        <ViroAnimatedComponent
          animation={IDLE_ANIMATION_NAME}
          loop
          run
          delay={0}
          onStart={() => undefined}
          onFinish={() => undefined}
        >
          {/*
           * Stand-in sphere: 20 cm radius, orange to match brand palette.
           * position Y=0.1 places it 10 cm above the plane surface so it
           * sits visually on the ground rather than half-submerged.
           */}
          <ViroSphere position={[0, 0.1, 0]} radius={0.1} materials={[]} />
        </ViroAnimatedComponent>
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}

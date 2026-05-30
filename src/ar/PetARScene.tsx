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
        alignment="Horizontal"
        minWidth={0.1}
        minHeight={0.1}
        hideOverlayOnSelection
      >
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
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}

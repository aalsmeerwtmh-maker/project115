/**
 * ImageMarkerScene — Viro scene that detects registered image targets and
 * awards tokens when a target is found.
 *
 * PLACEHOLDER NOTE: The image targets are registered with placeholder 1×1 white PNGs
 * (see arResources.ts). Detection will not fire against placeholders — this is expected.
 * Replace placeholder_*.png with real team-authored images before the demo.
 *
 * Usage: pass as `initialScene` to ViroARSceneNavigator, alongside `onMarkerFound` prop.
 */
import {
  ViroARScene,
  ViroARImageMarker,
  ViroNode,
  ViroSphere,
  ViroMaterials,
} from '@reactvision/react-viro';
import { insertCheckinEvent } from '@/db/repositories/events';
import { useProgressStore } from '@/stores/progressStore';
import { generateId } from '@/utils/id';
import { IMAGE_MARKER_NAMES, IMAGE_MARKER_TOKEN_REWARD, type ImageMarkerName } from './arResources';

// Ensure the orange placeholder material is registered before rendering.
ViroMaterials.createMaterials({
  markerIndicator: {
    lightingModel: 'Blinn',
    diffuseColor: '#5BC0DE', // info blue — indicates a discovered marker
  },
});

interface ImageMarkerSceneProps {
  onMarkerFound?: (markerName: ImageMarkerName, tokensAwarded: number) => void;
}

// ViroARScene receives props injected by ViroARSceneNavigator via `viroAppProps`.
// We cast to our own interface to access typed callbacks.
type ViroSceneProps = {
  sceneNavigator: {
    viroAppProps?: ImageMarkerSceneProps;
  };
};

export function ImageMarkerScene({ sceneNavigator }: ViroSceneProps) {
  const { viroAppProps } = sceneNavigator;
  const addTokens = useProgressStore.getState().addTokens;

  function handleAnchorFound(markerName: ImageMarkerName) {
    const id = generateId();
    // Award tokens and insert a checkin event for the image marker discovery.
    insertCheckinEvent(id, 0, 0, {
      cellKey: `marker:${markerName}`,
      tokensAwarded: IMAGE_MARKER_TOKEN_REWARD,
    }).catch((err) => {
      console.warn('[ImageMarkerScene] insertCheckinEvent failed:', err);
    });
    addTokens(IMAGE_MARKER_TOKEN_REWARD).catch((err) => {
      console.warn('[ImageMarkerScene] addTokens failed:', err);
    });
    viroAppProps?.onMarkerFound?.(markerName, IMAGE_MARKER_TOKEN_REWARD);
  }

  return (
    <ViroARScene>
      {IMAGE_MARKER_NAMES.map((name) => (
        <ViroARImageMarker key={name} target={name} onAnchorFound={() => handleAnchorFound(name)}>
          {/* Small indicator sphere rendered on top of the detected marker. */}
          <ViroNode position={[0, 0.05, 0]}>
            <ViroSphere radius={0.03} facesOutward materials={['markerIndicator']} />
          </ViroNode>
        </ViroARImageMarker>
      ))}
    </ViroARScene>
  );
}

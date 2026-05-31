/**
 * ARWalkScreen — full-screen AR view launched from WalksScreen during a walk.
 *
 * Responsibilities:
 *  - Render ViroARSceneNavigator with PetARScene as the initial scene.
 *  - Auto-suspend AR (unmount the navigator) after INACTIVITY_TIMEOUT_MS of
 *    no user interaction; show a "AR paused — tap to resume" banner.
 *  - Show a thermal warning banner after THERMAL_WARNING_MS of continuous AR
 *    without an inactivity suspension.
 *  - Provide a back button that navigates cleanly to the Walks tab.
 *
 * All user-facing strings are sourced from src/i18n/en.ts under the `ar` key.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';
import { PetARScene } from '@/ar/PetARScene';
import type { ImageMarkerName } from '@/ar/arResources';
import { GAME_CONFIG } from '@/game/config';

// ---------------------------------------------------------------------------
// AR placement types and helpers
// ---------------------------------------------------------------------------

type PlacementStatus = 'scanning' | 'ready' | 'placing' | 'placed';

function getHintText(status: PlacementStatus): string {
  if (status === 'scanning') return t.ar.scanning;
  if (status === 'ready') return t.ar.tapToPlace;
  if (status === 'placing') return t.ar.placing;
  return t.ar.placed;
}

function ScanningRing() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View pointerEvents="none" style={[styles.scanningRing, animatedStyle]} />;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Milliseconds of no user interaction before AR is auto-suspended. */
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Milliseconds of continuous AR before the thermal warning banner appears.
 * Reset every time AR is suspended and resumed.
 */
const THERMAL_WARNING_MS = 3 * 60 * 1000; // 3 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ARWalkRouteProp = RouteProp<RootStackParamList, 'ARWalk'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ARWalkScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<ARWalkRouteProp>();

  // sessionId links this AR session back to the walk record in the DB.
  // Kept available for future use (e.g. logging AR duration against the session).
  const _sessionId = route.params.sessionId; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Whether the ViroARSceneNavigator is currently mounted.
  const [arActive, setArActive] = useState(true);

  // Marker discovery banner
  const [markerBannerText, setMarkerBannerText] = useState<string | null>(null);
  const markerBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMarkerFound(_markerName: ImageMarkerName, tokensAwarded: number) {
    setMarkerBannerText(`+${tokensAwarded} tokens — Marker discovered!`);
    if (markerBannerTimerRef.current) clearTimeout(markerBannerTimerRef.current);
    markerBannerTimerRef.current = setTimeout(() => {
      setMarkerBannerText(null);
    }, 3000);
  }

  // Placement status driven by PetARScene via onPlacementStateChanged callback.
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus>('scanning');

  // Timer that transitions 'placing' → 'placed' after the ViroNode has had time to render.
  const placingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPlacingTimer() {
    if (placingTimerRef.current !== null) {
      clearTimeout(placingTimerRef.current);
      placingTimerRef.current = null;
    }
  }

  function handlePlacementStateChanged(status: PlacementStatus) {
    clearPlacingTimer();
    setPlacementStatus(status);
    if (status === 'placing') {
      placingTimerRef.current = setTimeout(() => {
        placingTimerRef.current = null;
        setPlacementStatus('placed');
      }, GAME_CONFIG.ar.placingFeedbackMs);
    }
  }

  // PetARScene calls this on mount to hand us its placement trigger function.
  // We store it in a ref and call it when the overlay is pressed.
  // Direct callback avoids the viroAppProps re-render problem: sceneNavigator is
  // a mutated class field — the scene component never re-renders on prop changes.
  const tapHandlerRef = useRef<(() => void) | null>(null);
  function registerTapHandler(fn: () => void) {
    tapHandlerRef.current = fn;
  }

  // Whether the thermal warning banner is shown.
  const [showThermalWarning, setShowThermalWarning] = useState(false);

  // Ref: timer that fires when the user has been inactive for INACTIVITY_TIMEOUT_MS.
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref: timer that fires when the device has been in continuous AR for THERMAL_WARNING_MS.
  const thermalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Timer helpers
  // ---------------------------------------------------------------------------

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current !== null) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const clearThermalTimer = useCallback(() => {
    if (thermalTimer.current !== null) {
      clearTimeout(thermalTimer.current);
      thermalTimer.current = null;
    }
  }, []);

  /** Start (or restart) the inactivity countdown. Called on any user interaction. */
  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimer.current = setTimeout(() => {
      // Suspend AR on inactivity.
      setArActive(false);
      setShowThermalWarning(false);
      clearThermalTimer();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, clearThermalTimer]);

  /** Start the thermal warning countdown. Called when AR becomes active. */
  const startThermalTimer = useCallback(() => {
    clearThermalTimer();
    thermalTimer.current = setTimeout(() => {
      setShowThermalWarning(true);
    }, THERMAL_WARNING_MS);
  }, [clearThermalTimer]);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  // Start timers when AR becomes active; clear them when it suspends.
  useEffect(() => {
    if (arActive) {
      resetInactivityTimer();
      startThermalTimer();
    } else {
      clearInactivityTimer();
      clearThermalTimer();
    }
    return () => {
      clearInactivityTimer();
      clearThermalTimer();
    };
  }, [arActive, resetInactivityTimer, startThermalTimer, clearInactivityTimer, clearThermalTimer]);

  // Clear placing timer on unmount.
  useEffect(() => () => clearPlacingTimer(), []);

  // ---------------------------------------------------------------------------
  // Interaction handlers
  // ---------------------------------------------------------------------------

  /** Any touch in the AR area resets the inactivity clock. */
  function handleARInteraction() {
    if (arActive) {
      resetInactivityTimer();
    }
  }

  /** Resume after inactivity suspension. */
  function handleResume() {
    clearPlacingTimer();
    setArActive(true);
    setShowThermalWarning(false);
    setPlacementStatus('scanning');
  }

  /** Navigate back to the Walks tab, unmounting the AR session cleanly. */
  function handleClose() {
    setArActive(false); // unmount Viro before navigating to avoid native-layer leaks
    navigation.goBack();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root} onTouchStart={handleARInteraction}>
      <StatusBar hidden />

      {/* ViroARSceneNavigator — only mounted while AR is active */}
      {arActive && (
        <ViroARSceneNavigator
          style={styles.arNavigator}
          initialScene={{ scene: PetARScene }}
          autofocus={placementStatus !== 'placed'}
          shadowsEnabled={false}
          depthEnabled={GAME_CONFIG.ar.depthEnabled}
          viroAppProps={{
            onMarkerFound: handleMarkerFound,
            onPlacementStateChanged: handlePlacementStateChanged,
            registerTapHandler,
          }}
        />
      )}

      {/* Marker discovery banner */}
      {markerBannerText != null && (
        <View style={styles.markerBanner} pointerEvents="none">
          <Text style={styles.markerBannerText}>{markerBannerText}</Text>
        </View>
      )}

      {/* Paused overlay — shown when AR has been suspended due to inactivity */}
      {!arActive && (
        <TouchableOpacity style={styles.pausedOverlay} onPress={handleResume} activeOpacity={0.8}>
          <Text style={styles.pausedTitle}>{t.ar.arPaused}</Text>
          <Text style={styles.pausedSubtitle}>{t.ar.tapToResume}</Text>
        </TouchableOpacity>
      )}

      {/* Transparent tap target — active only when ready to place. Viro onClick
          does not fire on AR background (no 3D geometry to hit), so we capture
          taps here in RN and pass tapCount into the scene via viroAppProps. */}
      {arActive && placementStatus === 'ready' && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => tapHandlerRef.current?.()}
        />
      )}

      {/* Scanning ring — shown while scanning or ready; hidden once user has tapped */}
      {arActive && (placementStatus === 'scanning' || placementStatus === 'ready') && <ScanningRing />}

      {/* Placement hint — shown while AR is active */}
      {arActive && (
        <View style={styles.hintBanner} pointerEvents="none">
          <Text style={styles.hintText}>{getHintText(placementStatus)}</Text>
        </View>
      )}

      {/* Thermal warning banner */}
      {arActive && showThermalWarning && (
        <View style={styles.thermalBanner} pointerEvents="none">
          <Text style={styles.thermalText}>{t.ar.deviceWarm}</Text>
        </View>
      )}

      {/* HUD — close button, always on top */}
      <SafeAreaView style={styles.hud} pointerEvents="box-none" edges={['top']}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeButtonText}>{t.ar.exitAR}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BANNER_HORIZONTAL_MARGIN = spacing.md;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  arNavigator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  // ---- Paused overlay ----
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedTitle: {
    ...typography.heading2,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  pausedSubtitle: {
    ...typography.body,
    color: '#FFFFFF',
    opacity: 0.85,
  },

  // ---- Scanning ring ----
  scanningRing: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ---- Placement hint ----
  hintBanner: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: BANNER_HORIZONTAL_MARGIN,
    right: BANNER_HORIZONTAL_MARGIN,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  hintText: {
    ...typography.caption,
    color: '#FFFFFF',
  },

  // ---- Thermal warning ----
  thermalBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
    left: BANNER_HORIZONTAL_MARGIN,
    right: BANNER_HORIZONTAL_MARGIN,
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  thermalText: {
    ...typography.caption,
    color: colors.textPrimary,
  },

  // ---- Marker discovery banner ----
  markerBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.xxl + spacing.lg : spacing.xl,
    left: BANNER_HORIZONTAL_MARGIN,
    right: BANNER_HORIZONTAL_MARGIN,
    backgroundColor: colors.info,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  markerBannerText: {
    ...typography.bodyBold,
    color: colors.surface,
  },

  // ---- HUD ----
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    margin: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    ...typography.label,
    color: '#FFFFFF',
  },
});

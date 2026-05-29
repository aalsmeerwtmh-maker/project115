// Placeholder — hook wrapping expo-sensors Pedometer (CMPedometer on iOS, StepCounter sensor on Android).
// Uses the device's hardware step-counter chip directly — no smartwatch or Health Connect needed.
// Background step counting on Android requires a foreground service (implement in Phase 1).
export function useStepCounter() {
  return { steps: 0 };
}

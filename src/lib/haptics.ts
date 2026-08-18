/**
 * Haptic shims. No-ops on the web build; a native engineer maps these to
 * Capacitor Haptics later without touching call sites.
 */
export function tick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(8);
    } catch {
      /* unsupported */
    }
  }
}

export function success() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.([10, 40, 18]);
    } catch {
      /* unsupported */
    }
  }
}

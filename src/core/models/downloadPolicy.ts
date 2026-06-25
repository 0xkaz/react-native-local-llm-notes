/**
 * Pure decision logic for the "download over Wi-Fi only" setting.
 *
 * Kept framework-agnostic (no NetInfo / React Native imports) so it is fully
 * unit-tested without a device. The app layer supplies `isWifi` from NetInfo.
 */

export interface WifiDownloadContext {
  /** The user's "Wi-Fi only" preference. */
  wifiOnly: boolean;
  /**
   * Whether the active connection is a metered cellular/mobile connection
   * (NetInfo `type === 'cellular'`). We block on cellular specifically rather
   * than "not Wi-Fi", so ethernet, VPN, emulators and unknown connections —
   * which NetInfo often reports as something other than 'wifi' — are not
   * blocked. "Download over Wi-Fi only" really means "not over mobile data".
   */
  isCellular: boolean;
  /** Whether the model file is already downloaded (no network needed). */
  alreadyDownloaded: boolean;
}

/**
 * Whether a model download should be blocked. Only an actual (re)download over
 * a cellular connection is blocked — loading an already-downloaded model needs
 * no network, so it is always allowed.
 */
export function isWifiOnlyDownloadBlocked(ctx: WifiDownloadContext): boolean {
  return ctx.wifiOnly && ctx.isCellular && !ctx.alreadyDownloaded;
}

/**
 * Whether a computed digest matches the expected one (case-insensitive hex).
 * When no checksum is known (`expected` empty/undefined) verification is skipped
 * and this returns true — so models without a published hash still load.
 */
export function sha256Matches(
  expected: string | undefined,
  actual: string,
): boolean {
  if (!expected) return true;
  return expected.trim().toLowerCase() === actual.trim().toLowerCase();
}

/**
 * Thrown to abort a model download that would violate the "Wi-Fi only" setting.
 * Raised from the `onWillDownload` hook the engine calls only when an actual
 * download is about to start, so it is authoritative regardless of stored
 * state (e.g. a 'downloaded' state whose file is missing still triggers it).
 */
export class WifiOnlyDownloadBlockedError extends Error {
  constructor() {
    super('Download blocked: Wi-Fi only is enabled and the device is not on Wi-Fi.');
    this.name = 'WifiOnlyDownloadBlockedError';
  }
}

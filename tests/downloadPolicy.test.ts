import {
  isWifiOnlyDownloadBlocked,
  sha256Matches,
} from '../src/core/models/downloadPolicy';

describe('isWifiOnlyDownloadBlocked', () => {
  test('blocks a new download on cellular when Wi-Fi only is on', () => {
    expect(
      isWifiOnlyDownloadBlocked({
        wifiOnly: true,
        isCellular: true,
        alreadyDownloaded: false,
      }),
    ).toBe(true);
  });

  test('allows on a non-cellular connection (wifi/ethernet/emulator) when Wi-Fi only is on', () => {
    expect(
      isWifiOnlyDownloadBlocked({
        wifiOnly: true,
        isCellular: false,
        alreadyDownloaded: false,
      }),
    ).toBe(false);
  });

  test('allows on cellular when Wi-Fi only is off', () => {
    expect(
      isWifiOnlyDownloadBlocked({
        wifiOnly: false,
        isCellular: true,
        alreadyDownloaded: false,
      }),
    ).toBe(false);
  });

  test('never blocks loading an already-downloaded model (no network needed)', () => {
    expect(
      isWifiOnlyDownloadBlocked({
        wifiOnly: true,
        isCellular: true,
        alreadyDownloaded: true,
      }),
    ).toBe(false);
  });
});

describe('sha256Matches', () => {
  const HASH =
    '6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e';

  test('matches case-insensitively', () => {
    expect(sha256Matches(HASH, HASH.toUpperCase())).toBe(true);
  });

  test('rejects a different digest', () => {
    expect(sha256Matches(HASH, 'deadbeef')).toBe(false);
  });

  test('skips verification when no checksum is published', () => {
    expect(sha256Matches(undefined, 'anything')).toBe(true);
    expect(sha256Matches('', 'anything')).toBe(true);
  });
});

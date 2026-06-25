import { isWifiOnlyDownloadBlocked } from '../src/core/models/downloadPolicy';

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

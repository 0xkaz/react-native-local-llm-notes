const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration.
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // GGUF model files are downloaded at runtime, never bundled — keep them out
    // of the asset graph so Metro does not try to package them.
    assetExts: getDefaultConfig(__dirname).resolver.assetExts.filter(
      (ext) => ext !== 'gguf' && ext !== 'bin',
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

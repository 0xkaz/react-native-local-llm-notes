/**
 * React Native CLI configuration.
 *
 * All native dependencies here use autolinking, so no manual `dependencies`
 * entries are required. react-native-vector-icons (a transitive peer of
 * react-native-paper) ships the MaterialCommunityIcons font used by the UI;
 * list it so the font is copied into the native projects on build.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};

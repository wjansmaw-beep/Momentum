// Horizon B (ADR-057): react-native-worklets/plugin is vereist voor Reanimated 4.
// babel-preset-expo wordt bewust opgelost vanuit het expo-pakket: in deze
// installatie staat de preset genest onder node_modules/expo, waardoor een kale
// preset-naam vanuit de projectroot niet resolveert.
const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      require.resolve('babel-preset-expo', {
        paths: [path.dirname(require.resolve('expo/package.json'))],
      }),
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};

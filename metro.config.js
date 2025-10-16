const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  const { assetExts } = config.resolver;
  return {
    ...config,
    resolver: {
      ...config.resolver,
      assetExts: assetExts,
      resolverMainFields: ['react-native', 'browser', 'main'],
      platforms: ['ios', 'android', 'web'],
      extraNodeModules: {
        '@radix-ui/react-slot': path.resolve(__dirname, 'node_modules/@radix-ui/react-slot'),
        '@radix-ui/react-compose-refs': path.resolve(__dirname, 'node_modules/@radix-ui/react-compose-refs')
      }
    },
    watchFolders: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'node_modules/@radix-ui')
    ],
    transformer: {
      ...config.transformer,
      unstable_allowRequireContext: true,
      enableBabelRCLookup: false,
      enableBabelRuntime: false,
    },
    maxWorkers: 2,
    resetCache: true,
    cacheStores: [],
  };
})(); 
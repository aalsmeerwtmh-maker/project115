const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// GLB/GLTF are binary 3-D model formats — Metro must treat them as opaque assets,
// not attempt to parse them as JavaScript modules.
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable resolution of package.json "exports" field (needed for @noble/hashes/sha512 etc.)
config.resolver.unstable_enablePackageExports = true;

// Polyfill Node.js built-ins required by bitcoinjs-lib → cipher-base
config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	stream: require.resolve("stream-browserify"),
};

module.exports = config;

// WalletConnect requires these polyfills FIRST
import "@walletconnect/react-native-compat";
import "fast-text-encoding";
import "react-native-get-random-values";

// Polyfills for React Native
import { Buffer } from "buffer";

// Extend global types
declare global {
	var Buffer: typeof Buffer;
}

// Make Buffer available globally
global.Buffer = Buffer;

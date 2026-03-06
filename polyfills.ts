// Polyfills for React Native
import { Buffer } from 'buffer';

// Extend global types
declare global {
  var Buffer: typeof Buffer;
}

// Make Buffer available globally
global.Buffer = Buffer;

export { };


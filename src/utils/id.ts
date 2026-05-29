// ID generation — used when inserting new rows into any DB table.
// expo-crypto's randomUUID() is cryptographically random and works on both platforms
// without needing a polyfill (unlike Math.random-based alternatives).
import { randomUUID } from 'expo-crypto';

export function generateId(): string {
  return randomUUID();
}

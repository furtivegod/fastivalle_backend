/**
 * Firebase Admin SDK - used to verify Firebase ID tokens from the app.
 * The app signs in with Google via Firebase Auth and sends the Firebase idToken.
 *
 * GOOGLE_APPLICATION_CREDENTIALS can be:
 * - File path: ./service-account.json
 * - Inline JSON: {"type":"service_account",...} (use GOOGLE_APPLICATION_CREDENTIALS_JSON in .env for multi-line)
 * - Base64-encoded JSON: set value to base64 string (e.g. from: cat service-account.json | base64)
 */

const admin = require('firebase-admin');

let initialized = false;

function getServiceAccountFromEnv() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  // Inline JSON (starts with {)
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.warn('GOOGLE_APPLICATION_CREDENTIALS JSON parse failed:', e.message);
      return null;
    }
  }
  // Base64-encoded JSON (no path chars, not JSON)
  if (!trimmed.includes('/') && !trimmed.includes('\\') && !trimmed.endsWith('.json')) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      if (decoded.startsWith('{')) return JSON.parse(decoded);
    } catch (e) {
      // fall through to file path
    }
  }
  // File path
  try {
    const path = require('path');
    const credPath = path.resolve(process.cwd(), trimmed);
    return require(credPath);
  } catch (e) {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS file load failed:', e.message);
    return null;
  }
}

function initFirebase() {
  if (initialized) return;
  try {
    const serviceAccount = getServiceAccountFromEnv();
    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      initialized = true;
      console.log('Firebase Admin initialized (service account)');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      initialized = true;
      console.log('Firebase Admin initialized (project ID)');
    }
  } catch (err) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.FIREBASE_PROJECT_ID) {
      console.warn('Firebase Admin init failed:', err.message);
    }
  }
}

initFirebase();

module.exports = { admin, isFirebaseInitialized: () => initialized };

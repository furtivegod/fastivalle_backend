/**
 * Firebase Admin SDK - used to verify Firebase ID tokens from the app.
 * The app signs in with Google via Firebase Auth and sends the Firebase idToken.
 */

const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {
  if (initialized) return;
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const path = require('path');
      const credPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
      const serviceAccount = require(credPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      initialized = true;
      console.log('Firebase Admin initialized (service account)');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      initialized = true;
      console.log('Firebase Admin initialized (project ID)');
    }
  } catch (err) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_PROJECT_ID) {
      console.warn('Firebase Admin init failed:', err.message);
    }
  }
}

initFirebase();

module.exports = { admin, isFirebaseInitialized: () => initialized };

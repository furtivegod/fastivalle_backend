/**
 * Server-side verification of Firebase and Apple ID tokens.
 * App sends Firebase idToken (Google Sign-In via Firebase) or Apple identityToken.
 */

const verifyAppleToken = require('verify-apple-id-token').default;
const { admin, isFirebaseInitialized } = require('../config/firebase');

/**
 * Verify Firebase ID token (from app: auth().currentUser.getIdToken()).
 * Use when the app uses Firebase Auth with Google Sign-In.
 * @param {string} idToken - Firebase idToken from the app
 * @returns {Promise<{ uid, email?, name?, picture? }>} Decoded payload; sub/uid is the stable user id
 */
const verifyFirebaseIdToken = async (idToken) => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Admin not configured (set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID)');
  }
  const decoded = await admin.auth().verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    sub: decoded.uid,
    email: decoded.email || null,
    name: decoded.name || null,
    picture: decoded.picture || null,
  };
};

/**
 * Verify Apple identity token and return payload
 * @param {string} identityToken - The identity_token from Sign in with Apple
 * @param {string} [nonce] - Optional nonce if you sent one in the auth request
 * @returns {Promise<{ sub, email? }>} Decoded payload or null
 */
const verifyAppleIdToken = async (identityToken, nonce) => {
  const clientId = process.env.APPLE_CLIENT_ID; // Your Services ID (e.g. com.yourapp.service)
  if (!clientId) {
    console.warn('APPLE_CLIENT_ID not set - skipping server-side verification');
    return null;
  }

  try {
    const jwtClaims = await verifyAppleToken({
      idToken: identityToken,
      clientId,
      nonce: nonce || undefined,
    });
    // sub = Apple user ID, email may be present (only on first sign-in)
    return jwtClaims; // { sub, email?, email_verified?, ... }
  } catch (err) {
    console.error('Apple token verification failed:', err.message);
    throw new Error('Invalid Apple token');
  }
};

module.exports = {
  verifyFirebaseIdToken,
  verifyAppleIdToken,
};

/**
 * Server-side verification of Google and Apple ID tokens
 * Use these in production to ensure tokens are valid and not forged.
 */

const { OAuth2Client } = require('google-auth-library');
const verifyAppleToken = require('verify-apple-id-token').default;

/**
 * Verify Google ID token and return payload
 * @param {string} idToken - The id_token from Google Sign-In
 * @returns {Promise<{ sub, email, name?, picture? }>} Decoded payload or null
 */
const verifyGoogleToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.warn('GOOGLE_CLIENT_ID not set - skipping server-side verification');
    return null;
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    return ticket.getPayload(); // { sub, email, email_verified, name, picture, ... }
  } catch (err) {
    console.error('Google token verification failed:', err.message);
    throw new Error('Invalid Google token');
  }
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
  verifyGoogleToken,
  verifyAppleIdToken,
};

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate a secure account linking token
 * @param {string} userId - User ID to link
 * @param {string} phone - Phone number for verification
 * @returns {string} Signed JWT token
 */
export const generateLinkToken = (userId, phone) => {
  // Create a random nonce for additional security
  const nonce = crypto.randomBytes(16).toString('hex');

  return jwt.sign(
    {
      userId,
      phone,
      nonce,
      type: 'account_link'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' } // Token expires in 24 hours
  );
};

/**
 * Verify and decode a link token
 * @param {string} token - The link token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyLinkToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify it's the correct token type
    if (decoded.type !== 'account_link') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Link token has expired. Please request a new invitation.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid link token');
    }
    throw error;
  }
};

/**
 * Generate an invitation URL for account linking
 * @param {string} token - The link token
 * @param {string} liffUrl - Base LIFF URL
 * @returns {string} Complete invitation URL
 */
export const generateInvitationUrl = (token, liffUrl = process.env.LIFF_URL) => {
  return `${liffUrl}/link?token=${encodeURIComponent(token)}`;
};

/**
 * Extract link token from invitation URL
 * @param {string} url - The invitation URL
 * @returns {string|null} The token or null if not found
 */
export const extractTokenFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token');
  } catch (error) {
    return null;
  }
};

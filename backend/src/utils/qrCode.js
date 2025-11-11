import QRCode from 'qrcode';

/**
 * Generate a QR code image from data
 * @param {string} data - The data to encode (typically an invitation URL)
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} Base64 encoded QR code image
 */
export const generateQRCode = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,
      ...options
    };

    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(data, defaultOptions);

    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as buffer (for file download)
 * @param {string} data - The data to encode
 * @param {Object} options - QR code generation options
 * @returns {Promise<Buffer>} QR code image buffer
 */
export const generateQRCodeBuffer = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,
      ...options
    };

    const buffer = await QRCode.toBuffer(data, defaultOptions);

    return buffer;
  } catch (error) {
    console.error('QR code buffer generation failed:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

/**
 * Generate QR code for account linking invitation
 * @param {string} invitationUrl - The invitation URL
 * @returns {Promise<string>} Base64 encoded QR code
 */
export const generateLinkingQRCode = async (invitationUrl) => {
  return await generateQRCode(invitationUrl, {
    width: 400,
    margin: 2
  });
};

import axios from 'axios';

/**
 * Verify a LIFF access token with LINE API
 * @param {string} liffToken - The LIFF access token from the mobile app
 * @returns {Promise<Object>} Token verification result
 */
export const verifyLiffToken = async (liffToken) => {
  try {
    const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
      params: {
        access_token: liffToken
      }
    });

    // Check if token is valid and belongs to our LINE Login channel
    if (response.data.client_id !== process.env.LINE_LOGIN_CHANNEL_ID) {
      throw new Error('Token does not belong to this LINE Login channel');
    }

    return {
      valid: true,
      channelId: response.data.client_id,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    console.error('LINE token verification failed:', error.message);
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Get LINE user profile using LIFF access token
 * @param {string} liffToken - The LIFF access token
 * @returns {Promise<Object>} LINE user profile
 */
export const getLINEProfile = async (liffToken) => {
  try {
    const response = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${liffToken}`
      }
    });

    return {
      userId: response.data.userId,
      displayName: response.data.displayName,
      pictureUrl: response.data.pictureUrl || null,
      statusMessage: response.data.statusMessage || null
    };
  } catch (error) {
    console.error('Failed to get LINE profile:', error.message);
    throw new Error('Unable to retrieve LINE profile');
  }
};

/**
 * Send LINE push message to a user
 * @param {string} lineUserId - LINE user ID
 * @param {Array} messages - Array of LINE message objects
 * @returns {Promise<boolean>} Success status
 */
export const sendLINEMessage = async (lineUserId, messages) => {
  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: lineUserId,
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Failed to send LINE message:', error.message);
    return false;
  }
};

/**
 * Send account linking notification
 * @param {string} lineUserId - LINE user ID
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} Success status
 */
export const sendLinkingNotification = async (lineUserId, userName) => {
  const messages = [
    {
      type: 'text',
      text: `สวัสดี ${userName}! 👋\n\nบัญชี CheckDee ของคุณได้เชื่อมโยงกับ LINE สำเร็จแล้ว ตอนนี้คุณสามารถเข้าใช้งานแอปได้เลย!`
    }
  ];

  return await sendLINEMessage(lineUserId, messages);
};

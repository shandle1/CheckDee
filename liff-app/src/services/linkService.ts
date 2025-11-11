import api from '../lib/api';

export interface LinkViaPhoneResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LinkViaTokenResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface LinkStatusResponse {
  linked: boolean;
  user?: {
    id: string;
    name: string;
    role: string;
    linkedAt: string;
  };
}

export interface LineAuthResponse {
  linked: boolean;
  lineProfile?: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    lineProfile: {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };
  };
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Link a LINE account to a CheckDee account using phone number
 */
export const linkViaPhone = async (
  liffToken: string,
  phone: string
): Promise<LinkViaPhoneResponse> => {
  const response = await api.post('/line/link-phone', {
    liffToken,
    phone,
  });
  return response.data;
};

/**
 * Link a LINE account to a CheckDee account using invitation token
 */
export const linkViaToken = async (
  liffToken: string,
  linkToken: string
): Promise<LinkViaTokenResponse> => {
  const response = await api.post('/line/link-token', {
    liffToken,
    linkToken,
  });
  return response.data;
};

/**
 * Check if a LINE user ID is linked to a CheckDee account
 */
export const checkLinkStatus = async (
  lineUserId: string
): Promise<LinkStatusResponse> => {
  const response = await api.get(`/line/link-status/${lineUserId}`);
  return response.data;
};

/**
 * Authenticate using LINE LIFF token
 * Returns linked status and JWT tokens if linked
 */
export const authenticateWithLINE = async (
  liffToken: string
): Promise<LineAuthResponse> => {
  const response = await api.post('/line/auth', {
    liffToken,
  });
  return response.data;
};

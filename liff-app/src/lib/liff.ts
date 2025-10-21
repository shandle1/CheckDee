import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export const initLiff = async (): Promise<void> => {
  try {
    await liff.init({ liffId: LIFF_ID });
    console.log('LIFF initialized successfully');
  } catch (error) {
    console.error('LIFF initialization failed', error);
    throw error;
  }
};

export const isLoggedIn = (): boolean => {
  return liff.isLoggedIn();
};

export const login = (): void => {
  liff.login();
};

export const logout = (): void => {
  liff.logout();
};

export const getLiffProfile = async (): Promise<LiffProfile | null> => {
  try {
    if (!liff.isLoggedIn()) {
      return null;
    }
    const profile = await liff.getProfile();
    return profile;
  } catch (error) {
    console.error('Failed to get LIFF profile', error);
    return null;
  }
};

export const getAccessToken = (): string | null => {
  try {
    if (!liff.isLoggedIn()) {
      return null;
    }
    return liff.getAccessToken();
  } catch (error) {
    console.error('Failed to get access token', error);
    return null;
  }
};

export const closeWindow = (): void => {
  liff.closeWindow();
};

export const sendMessages = async (messages: any[]): Promise<void> => {
  try {
    await liff.sendMessages(messages);
  } catch (error) {
    console.error('Failed to send messages', error);
    throw error;
  }
};

export const isInClient = (): boolean => {
  return liff.isInClient();
};

export const getOS = (): string => {
  return liff.getOS();
};

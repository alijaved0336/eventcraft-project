import { config } from '../../config';
import { logger } from '../../lib/logger';

// Custom error for API failures
export class DailyError extends Error {
  constructor(public message: string, public statusCode: number = 502, public context?: any) {
    super(message);
    this.name = 'DailyError';
  }
}

const DAILY_BASE = 'https://api.daily.co/v1';

export interface DailyRoom {
  name: string;
  url: string;
  privacy: string;
  config?: {
    exp?: number;
    max_participants?: number;
  };
}

export interface DailyToken {
  token: string;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${config.dailyApiKey}`,
});

export const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = i < retries && (err.statusCode >= 500 || !err.statusCode);
      if (!isRetryable) throw err;
      
      const backoff = delayMs * 2 ** i;
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn(`Daily API retry ${i + 1}/${retries} after ${backoff}ms`, { error: errorMessage });
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw new Error('Retry failed'); // Should never hit this due to throw err above
};

export const createDailyRoom = async (roomName: string, options: { maxParticipants: number; expiryHours: number }): Promise<DailyRoom> => {
  const exp = Math.floor(Date.now() / 1000) + options.expiryHours * 3600;
  
  const body = {
    name: roomName,
    privacy: 'public',
    properties: {
      max_participants: options.maxParticipants,
      nbf: Math.floor(Date.now() / 1000),
      exp,
      enable_knocking: false, // Unified access: no host approval required
      enable_chat: true,
      enable_screenshare: true,
      eject_at_room_exp: true,
      owner_only_broadcast: false, // ensures all can speak if needed
      start_video_off: false,
      start_audio_off: false,
    },
  };

  const res = (await fetch(`${DAILY_BASE}/rooms`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })) as any;

  if (res.status === 409) {
    logger.info(`Daily room already exists with name ${roomName}, fetching details.`);
    const existing = await getDailyRoom(roomName);
    if (!existing) throw new DailyError('Daily reported conflict but room not found', 500);
    return existing;
  }

  if (!res.ok) {
    const errBody = await res.text();
    logger.error('Daily.co provision room failure', { 
      status: res.status, 
      body: errBody, 
      roomName,
      options 
    });
    let parsedErr;
    try { parsedErr = JSON.parse(errBody); } catch (e) { /* use raw body */ }

    // Handle case where Daily returns 400 for already existing room instead of 409
    if (res.status === 400 && parsedErr?.info?.includes('already exists')) {
       logger.info(`Daily room already exists (from 400 error) with name ${roomName}, fetching.`);
       const existing = await getDailyRoom(roomName);
       if (!existing) throw new DailyError('Daily reported conflict but room not found', 500);
       return existing;
    }

    throw new DailyError(`Daily.co error: ${parsedErr?.error || parsedErr?.info || res.statusText || errBody}`, res.status);
  }

  return res.json() as Promise<DailyRoom>;
};

export const getDailyRoom = async (roomName: string): Promise<DailyRoom | null> => {
  const res = (await fetch(`${DAILY_BASE}/rooms/${roomName}`, {
    method: 'GET',
    headers: getHeaders(),
  })) as any;

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new DailyError(`Daily.co fetch error: ${err.error || res.statusText}`, res.status);
  }

  return res.json() as Promise<DailyRoom>;
};

export const createDailyToken = async (
  roomName: string,
  options: { isOwner: boolean; expiryHours: number; userId?: string; userName?: string },
): Promise<DailyToken> => {
  const exp = Math.floor(Date.now() / 1000) + options.expiryHours * 3600;

  const body = {
    properties: {
      room_name: roomName,
      is_owner: options.isOwner,
      enable_recording: false,
      user_id: options.userId,
      user_name: options.userName,
      exp,
    },
  };

  const res = (await fetch(`${DAILY_BASE}/meeting-tokens`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })) as any;

  if (!res.ok) {
    const errBody = await res.text();
    logger.error('Daily.co token generation failure', { 
      status: res.status, 
      body: errBody, 
      roomName,
      payload: body
    });
    let parsedErr;
    try { parsedErr = JSON.parse(errBody); } catch (e) { /* use raw body */ }
    throw new DailyError(`Daily token generation failed: ${parsedErr?.error || parsedErr?.info || res.statusText || errBody}`, res.status);
  }

  return res.json() as Promise<DailyToken>;
};

export const deleteDailyRoom = async (roomName: string) => {
  const res = (await fetch(`${DAILY_BASE}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })) as any;

  if (!res.ok && res.status !== 404) {
    const err = (await res.json()) as any;
    throw new DailyError(`Daily room deletion failed: ${err.error || res.statusText}`, res.status);
  }

  return true;
};

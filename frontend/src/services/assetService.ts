import type { Duty, Venture } from '../types';

const API_BASE_URL = '/api/assets';

/**
 * Fetches all available duties from the backend.
 * @returns A promise that resolves to an array of Duty objects.
 */
export const getDuties = async (): Promise<Duty[]> => {
  const response = await fetch(`${API_BASE_URL}/duties`);
  if (!response.ok) {
    throw new Error('Failed to fetch duties');
  }
  return response.json();
};

/**
 * Fetches all available ventures from the backend.
 * @returns A promise that resolves to an array of Venture objects.
 */
export const getVentures = async (): Promise<Venture[]> => {
    const response = await fetch(`${API_BASE_URL}/ventures`);
    if (!response.ok) {
        throw new Error('Failed to fetch ventures');
    }
    return response.json();
};


/**
 * Sends a request to the backend to refresh its asset cache from the disk.
 */
export const refreshAssets = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to refresh assets');
  }
  return response.json();
};

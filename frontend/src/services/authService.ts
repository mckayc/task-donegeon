import type { NewAdminData, User } from '../types';

const API_BASE_URL = '/api';

/**
 * Checks if a "Donegeon Master" (admin) account exists by querying the backend.
 * @returns A promise that resolves to true if an admin exists, false otherwise.
 */
export const checkAdminExists = async (): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/auth/admin-exists`);
  if (!response.ok) {
    throw new Error('Failed to check admin status');
  }
  const data = await response.json();
  return data.exists;
};

/**
 * Creates the first "Donegeon Master" (admin) account by sending data to the backend.
 * @param data The admin user's data.
 * @returns A promise that resolves to the new user's data and a token.
 */
export const createAdmin = async (data: NewAdminData & { password: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create account');
  }
  return response.json() as Promise<{ token: string; user: User }>;
};

/**
 * Logs in a user by sending credentials to the backend.
 * @param gameName The user's game name.
 * @param password The user's password.
 * @returns A promise that resolves to the user's data and a token.
 */
export const login = async (gameName: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameName, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Invalid credentials');
  }
  return response.json() as Promise<{ token: string; user: User }>;
};

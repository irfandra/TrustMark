import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAPIBase = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api/v1';
  return 'http://127.0.0.1:8080/api/v1';
};

const API_BASE = getAPIBase();

// ─── Helpers ────────────────────────────────────────────────────

const getAuthHeaders = async () => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  if (!accessToken) throw new Error('Not authenticated. Please login first.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  console.log('RAW RESPONSE:', JSON.stringify(data, null, 2)); // ← add this
  if (response.ok && data.success) {
    return data.data;
  }
  throw new Error(data.error?.message || `Server error: ${response.status}`);
};

// ─── Auth Service ────────────────────────────────────────────────

export const authService = {

  /**
   * Register a new user without wallet
   */
  async registerWithoutWallet(userData) {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          userName: userData.userName,
          email: userData.email,
          password: userData.password,
        }),
      });

      return await handleResponse(response);
    } catch (err) {
      console.error('Error registering without wallet:', err);
      throw err;
    }
  },

  /**
   * Login with email and password
   */
  async loginWithEmail(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(response);
    } catch (err) {
      console.error('Error logging in with email:', err);
      throw err;
    }
  },
};

// ─── Wallet Service ──────────────────────────────────────────────

export const walletService = {

  /**
   * Check whether a wallet address is already registered
   */
  async isWalletRegistered(address) {
    try {
      const response = await fetch(
        `${API_BASE}/auth/wallet/check?address=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return Boolean(data?.data?.isRegistered);
    } catch (error) {
      console.error('Error checking wallet registration:', error);
      throw error;
    }
  },

  /**
   * Get nonce for wallet signing
   */
  async getWalletNonce(address) {
    try {
      const response = await fetch(
        `${API_BASE}/auth/wallet/nonce?address=${encodeURIComponent(address)}`
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  },

  /**
   * Login with wallet signature
   */
  async loginWithWallet(walletAddress, signature, message) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature, message }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error logging in with wallet:', error);
      throw error;
    }
  },

  /**
   * Register with wallet
   */
  async registerWithWallet(walletAddress, signature, message, formData = {}) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallet/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          userName: formData.userName || '',
          walletAddress,
          signature,
          message,
        }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error registering with wallet:', error);
      throw error;
    }
  },

  /**
   * Fetch all wallets for a user
   */
  async getUserWallets(userId) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE}/wallets?userId=${encodeURIComponent(userId)}`,
        { headers }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  },

  /**
   * Fetch a single wallet by address
   */
  async getWalletByAddress(address) {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE}/wallets/${encodeURIComponent(address)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  },

  /**
   * Add a new wallet to the user's account
   */
  async addWallet(address, name = 'My Wallet') {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/wallets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ address, name }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  },

  /**
   * Get available wallets — always fetch fresh, no stale cache
   */
  async getAvailableWallets(forceRefresh = false) {
    try {
      // Return cache only if not forcing refresh
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem('availableWallets');
        if (cached) return JSON.parse(cached);
      }

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return [];

      const response = await fetch(`${API_BASE}/wallets/available`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (data.success && data.data) {
        await AsyncStorage.setItem('availableWallets', JSON.stringify(data.data));
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error getting available wallets:', error);
      return [];
    }
  },

  /**
   * Clear cached wallets (call after adding/removing wallets)
   */
  async clearWalletCache() {
    await AsyncStorage.removeItem('availableWallets');
  },
};
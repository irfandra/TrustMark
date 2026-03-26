import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAPIBase = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api/v1';
  return 'http://127.0.0.1:8080/api/v1';
};

const API_BASE = getAPIBase();

/**
 * Wallet Service - Handles all wallet-related API communications
 */
export const walletService = {
  /**
   * Fetch all wallets for a user from the backend
   * @param {string} userId - The user ID or email to fetch wallets for
   * @returns {Promise<Array>} Array of wallet objects
   */
  async getUserWallets(userId) {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found. User may not be authenticated.');
      }

      const response = await fetch(`${API_BASE}/wallets?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error?.message || 'Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  },

  /**
   * Fetch a single wallet by address
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} Wallet object with address, name, etc.
   */
  async getWalletByAddress(address) {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE}/wallets/${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch wallet');
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  },

  /**
   * Add a new wallet to the user's account
   * @param {string} address - Wallet address
   * @param {string} name - Optional wallet name/label
   * @returns {Promise<Object>} Created wallet object
   */
  async addWallet(address, name = null) {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found. User may not be authenticated.');
      }

      const response = await fetch(`${API_BASE}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          address,
          name: name || 'My Wallet',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to add wallet');
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  },

  /**
   * Get nonce for wallet signing
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} Object with nonce and message
   */
  async getWalletNonce(address) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallet/nonce?address=${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data; // Returns { nonce, message }
      } else {
        throw new Error(data.error?.message || 'Failed to get nonce');
      }
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  },

  /**
   * Verify wallet signature and login
   * @param {string} walletAddress - Wallet address
   * @param {string} signature - Signed message
   * @param {string} message - Original message that was signed
   * @returns {Promise<Object>} Authentication response with tokens
   */
  async loginWithWallet(walletAddress, signature, message) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data; // Returns { accessToken, refreshToken, user }
      } else {
        throw new Error(data.error?.message || 'Wallet login failed');
      }
    } catch (error) {
      console.error('Error logging in with wallet:', error);
      throw error;
    }
  },

  /**
   * Register a new wallet
   * @param {string} walletAddress - Wallet address
   * @param {string} signature - Signed message
   * @param {string} message - Original message that was signed
   * @returns {Promise<Object>} Authentication response with tokens
   */
  async registerWithWallet(walletAddress, signature, message) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallet/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.data; // Returns { accessToken, refreshToken, user }
      } else {
        throw new Error(data.error?.message || 'Wallet registration failed');
      }
    } catch (error) {
      console.error('Error registering with wallet:', error);
      throw error;
    }
  },

  /**
   * Get list of available wallets (for user to select from)
   * This is used when signing transactions - user selects which wallet to use
   * @returns {Promise<Array>} Array of available wallet addresses
   */
  async getAvailableWallets() {
    try {
      // Try to get from AsyncStorage first (cached)
      const cached = await AsyncStorage.getItem('availableWallets');
      if (cached) {
        return JSON.parse(cached);
      }

      // Otherwise fetch from backend if user is authenticated
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        return [];
      }

      const response = await fetch(`${API_BASE}/wallets/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Cache the result
          await AsyncStorage.setItem('availableWallets', JSON.stringify(data.data));
          return data.data;
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting available wallets:', error);
      return [];
    }
  },
};

export default walletService;

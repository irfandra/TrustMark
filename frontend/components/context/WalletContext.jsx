import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLinking from 'expo-linking';
import Constants from 'expo-constants';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';

const PROJECT_ID = '3adca6a523814c50dc4c6e9b6350a397';
const RELAY_URL = process.env.EXPO_PUBLIC_WALLETCONNECT_RELAY_URL || 'wss://relay.walletconnect.com';

const WalletContext = createContext();

const WalletProviderInner = ({ children }) => {
  const { open, disconnect, isConnected, address, provider } = useWalletConnectModal();
  const [wallet, setWallet] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const connectionStateRef = useRef({ isConnected: false, address: null });

  const safeDisconnect = useCallback(async () => {
    if (typeof disconnect === 'function') {
      await disconnect();
      return;
    }

    if (provider && typeof provider.disconnect === 'function') {
      await provider.disconnect();
    }
  }, [disconnect, provider]);

  const normalizeAddress = useCallback((value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  }, []);

  const mergeUniqueAddresses = useCallback((values) => {
    const seen = new Set();
    const uniqueAddresses = [];

    values.forEach((value) => {
      if (typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed.startsWith('0x')) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      uniqueAddresses.push(trimmed);
    });

    return uniqueAddresses;
  }, []);

  const refreshWalletAccounts = useCallback(async (preferredAddress = null) => {
    if (!provider || !isConnected) {
      setAccounts([]);
      return [];
    }

    let providerAccounts = [];
    try {
      let response = await provider.request({ method: 'eth_accounts' });
      if (!Array.isArray(response) || response.length === 0) {
        response = await provider.request({ method: 'eth_requestAccounts' });
      }
      if (Array.isArray(response)) {
        providerAccounts = response;
      }
    } catch (err) {
      console.warn('Failed to read wallet accounts from provider:', err?.message || err);
    }

    const availableAccounts = mergeUniqueAddresses([
      ...(Array.isArray(providerAccounts) ? providerAccounts : []),
      preferredAddress || '',
      wallet?.address || '',
    ]);

    setAccounts(availableAccounts);

    if (availableAccounts.length === 0) {
      return [];
    }

    const targetAddress =
      availableAccounts.find((entry) => normalizeAddress(entry) === normalizeAddress(preferredAddress)) ||
      availableAccounts.find((entry) => normalizeAddress(entry) === normalizeAddress(wallet?.address)) ||
      availableAccounts[0];

    if (targetAddress && normalizeAddress(targetAddress) !== normalizeAddress(wallet?.address)) {
      const walletData = { address: targetAddress, isConnected: true };
      setWallet(walletData);
      await AsyncStorage.setItem('walletAddress', targetAddress);
    }

    return availableAccounts;
  }, [provider, isConnected, mergeUniqueAddresses, wallet?.address, normalizeAddress]);

  useEffect(() => {
    connectionStateRef.current = { isConnected, address };
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected && address) {
      refreshWalletAccounts(address).catch((err) => {
        console.warn('Unable to set wallet from provider accounts:', err?.message || err);
      });
      return;
    }

    setWallet(null);
    setAccounts([]);
    AsyncStorage.removeItem('walletAddress').catch((err) => {
      console.error('Error clearing wallet address:', err);
    });
  }, [isConnected, address, refreshWalletAccounts]);

  useEffect(() => {
    if (!isConnected) return;
    refreshWalletAccounts(address).catch((err) => {
      console.warn('Unable to refresh wallet accounts:', err?.message || err);
    });
  }, [isConnected, address, provider, refreshWalletAccounts]);

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (typeof open !== 'function') {
        throw new Error('Wallet connector is not ready yet. Please try again.');
      }

      await open();

      const waitForConnection = async (timeoutMs = 45000, intervalMs = 250) => {
        const start = Date.now();

        while (Date.now() - start < timeoutMs) {
          const current = connectionStateRef.current;
          if (current.isConnected && current.address) {
            return current.address;
          }

          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }

        return null;
      };

      const connectedAddress = await waitForConnection();
      if (!connectedAddress) {
        throw new Error('Wallet connection timed out. Please return to the app after approving in MetaMask. If this continues, use a development build (expo run:android) instead of Expo Go.');
      }

      const walletData = { address: connectedAddress, isConnected: true };

      setWallet(walletData);
      await AsyncStorage.setItem('walletAddress', connectedAddress);
      await refreshWalletAccounts(connectedAddress);

      return walletData;
    } catch (err) {
      const errorMessage = err?.message || 'Failed to connect wallet';
      setError(errorMessage);

      const lower = errorMessage.toLowerCase();
      if (lower.includes('socket stalled') || lower.includes('relay.walletconnect')) {
        Alert.alert(
          'Wallet Network Error',
          'WalletConnect relay socket failed. Try switching network/VPN, then restart the app. You can also set EXPO_PUBLIC_WALLETCONNECT_RELAY_URL to wss://relay.walletconnect.com or wss://relay.walletconnect.org.'
        );
      } else if (!lower.includes('user rejected')) {
        Alert.alert('Connection Error', errorMessage);
      }

      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [open, refreshWalletAccounts]);

  const reconnectWallet = useCallback(async () => {
    try {
      await safeDisconnect();
      setWallet(null);
      setAccounts([]);
      await AsyncStorage.removeItem('walletAddress');
      await new Promise((resolve) => setTimeout(resolve, 250));
      return await connectWallet();
    } catch (err) {
      const errorMessage = err?.message || 'Failed to reconnect wallet';
      setError(errorMessage);
      throw err;
    }
  }, [connectWallet, safeDisconnect]);

  const signMessage = useCallback(async (message, addressOverride = null) => {
    const activeAddress = addressOverride || wallet?.address;
    if (!activeAddress) throw new Error('Wallet not connected');
    if (!provider) throw new Error('Wallet provider unavailable. Please reconnect wallet.');

    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, activeAddress],
      });

      return signature;
    } catch (err) {
      console.error('Signing error:', err);
      setError(err.message);
      throw err;
    }
  }, [wallet, provider]);

  const disconnectWallet = useCallback(async () => {
    try {
      await safeDisconnect();
      setWallet(null);
      setAccounts([]);
      setError(null);
      await AsyncStorage.removeItem('walletAddress');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }, [safeDisconnect]);

  return (
    <WalletContext.Provider value={{
      wallet,
      accounts,
      isConnecting,
      error,
      connectWallet,
      reconnectWallet,
      refreshWalletAccounts,
      disconnectWallet,
      signMessage,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const WalletProvider = ({ children }) => {
  if (!PROJECT_ID) {
    console.error('Missing EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable');
  }

  const isExpoGo = Constants.appOwnership === 'expo';
  const nativeRedirectUrl = isExpoGo ? ExpoLinking.createURL('/') : 'zeal://';

  const providerMetadata = useMemo(() => ({
    name: 'Zeal',
    description: 'Zeal Digital Seal App',
    url: 'https://zealapp.com',
    icons: ['https://zealapp.com/icon.png'],
    redirect: {
      native: nativeRedirectUrl,
      universal: 'https://zealapp.com',
    },
  }), [nativeRedirectUrl]);

  useEffect(() => {
    console.log('[WalletConnect] appOwnership:', Constants.appOwnership, 'nativeRedirect:', nativeRedirectUrl);
    console.log('[WalletConnect] relayUrl:', RELAY_URL);
  }, [nativeRedirectUrl]);

  return (
    <>
      <WalletConnectModal
        projectId={PROJECT_ID || ''}
        providerMetadata={providerMetadata}
        relayUrl={RELAY_URL}
      />
      <WalletProviderInner>
        {children}
      </WalletProviderInner>
    </>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
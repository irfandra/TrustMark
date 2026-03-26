import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';

const PROJECT_ID = "3adca6a523814c50dc4c6e9b6350a397";

const providerMetadata = {
  name: 'Zeal',
  description: 'Zeal Digital Seal App',
  url: 'https://zealapp.com',
  icons: ['https://zealapp.com/icon.png'],
  redirect: {
    native: 'zealapp://',
    universal: 'https://zealapp.com',
  },
};

const WalletContext = createContext();

// Inner component that uses the WalletConnect hook
const WalletProviderInner = ({ children }) => {
  const { open, close, isConnected, address, provider } = useWalletConnectModal();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Build wallet object from WalletConnect state
  const wallet = isConnected && address
    ? { address, isConnected: true }
    : null;

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Open WalletConnect modal — MetaMask will appear
      await open();

      // Poll until connected (modal handles the UX)
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (isConnected && address) {
            clearInterval(interval);
            setIsConnecting(false);
            resolve({ address, isConnected: true });
          }
        }, 500);

        // Timeout after 60 seconds
        setTimeout(() => {
          clearInterval(interval);
          setIsConnecting(false);
          resolve(null);
        }, 60000);
      });

    } catch (err) {
      const errorMsg = err.message || 'Failed to connect wallet';
      setError(errorMsg);
      Alert.alert('Connection Error', errorMsg);
      setIsConnecting(false);
      return null;
    }
  }, [open, isConnected, address]);

  // Sign message via MetaMask (no private key needed — MetaMask signs it)
  const signMessage = useCallback(async (message, addressOverride = null) => {
    const activeAddress = addressOverride || address;

    if (!activeAddress || !provider) {
      throw new Error('Wallet not connected');
    }

    try {
      // Open MetaMask for signing
      Linking.openURL('metamask://');

      // Request personal_sign from MetaMask via WalletConnect
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
  }, [address, provider]);

  const disconnectWallet = useCallback(async () => {
    try {
      await close();
      await AsyncStorage.removeItem('walletAddress');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }, [close]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Outer provider wraps with WalletConnectModal
export const WalletProvider = ({ children }) => {
  return (
    <>
      <WalletConnectModal
        projectId={PROJECT_ID}
        providerMetadata={providerMetadata}
      />
      <WalletProviderInner>
        {children}
      </WalletProviderInner>
    </>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
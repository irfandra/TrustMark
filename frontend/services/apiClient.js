import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAPIBase = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api/v1';
  return 'http://127.0.0.1:8080/api/v1';
};

export const API_BASE = getAPIBase();

const buildHeaders = async (authRequired = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authRequired) {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Not authenticated');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiRequest = async (
  path,
  { method = 'GET', body, authRequired = false } = {}
) => {
  const headers = await buildHeaders(authRequired);

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload;
  try {
    payload = await response.json();
  } catch (_error) {
    throw new Error(`Unexpected server response: ${response.status}`);
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message || payload?.message || `Server error: ${response.status}`);
  }

  return payload.data;
};

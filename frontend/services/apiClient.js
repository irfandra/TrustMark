export const API_BASE = 'http://127.0.0.1:8082/api/v1';

const buildHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    throw new Error(`Unexpected server response: ${response.status}`);
  }
};

const ensureSuccessPayload = (response, payload) => {
  if (response.ok && payload?.success) {
    return payload.data;
  }

  throw new Error(
    payload?.error?.message || payload?.message || `Server error: ${response.status}`
  );
};

export const apiRequest = async (
  path,
  { method = 'GET', body } = {}
) => {
  const headers = buildHeaders();

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await parseJsonResponse(response);
  return ensureSuccessPayload(response, payload);
};

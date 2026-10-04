import { DEMO_MODE, fetchDemo } from './demo';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  if (DEMO_MODE) return await fetchDemo(path, options) as T;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

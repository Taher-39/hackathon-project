import axios from "axios";
import { useAuthStore } from "./store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  // Without a timeout, a slow/hung request (e.g. a cold-starting free-tier
  // backend) just sits pending forever — it never rejects, so callers that
  // retry on failure (like the homepage's category-list loader) never get
  // the chance to. Bounding every request lets that retry/fallback logic
  // actually run instead of leaving the UI stuck on a loading state.
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post("/auth/refresh").then((res) => {
            const { user, token } = res.data.data;
            useAuthStore.getState().setAuth(user, token);
            return token as string;
          });
          refreshPromise.finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || "Something went wrong";
}

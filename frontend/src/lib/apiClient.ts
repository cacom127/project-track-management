import { getIdToken, logout } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * HTTP client dùng chung cho mọi request tới backend.
 * - AUTH-06: tự gắn `Authorization: Bearer <idToken>` (ID token, không
 *   phải access token) nếu đã đăng nhập.
 * - AUTH-08: nhận `401` (token hết hạn/invalid) -> xoá token + redirect
 *   `/login`. Dùng `window.location.assign` thay vì `useNavigate` vì
 *   module này không chạy trong context component React.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const idToken = getIdToken();
  const headers = new Headers(init.headers);
  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    logout();
    window.location.assign("/login");
  }

  return response;
}

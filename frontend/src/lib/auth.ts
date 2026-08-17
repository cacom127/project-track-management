import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
});

// Key lưu trong localStorage (AUTH-07) — không dùng key có sẵn của SDK
// để tránh xung đột nếu sau này đổi cách quản lý session.
const STORAGE_KEYS = {
  idToken: "auth.idToken",
  accessToken: "auth.accessToken",
  refreshToken: "auth.refreshToken",
} as const;

export type Tokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

export type LoginResult =
  | { status: "success"; tokens: Tokens }
  | { status: "newPasswordRequired"; cognitoUser: CognitoUser };

export type IdTokenPayload = {
  email: string;
  "cognito:groups"?: string[];
};

export type CurrentUser = {
  email: string;
  role: "admin" | "member";
};

function extractTokens(session: CognitoUserSession): Tokens {
  return {
    idToken: session.getIdToken().getJwtToken(),
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
  };
}

function storeTokens(tokens: Tokens): void {
  localStorage.setItem(STORAGE_KEYS.idToken, tokens.idToken);
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
}

/** AUTH-01: SRP, gọi thẳng Cognito — không qua backend. */
export function login(email: string, password: string): Promise<LoginResult> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const tokens = extractTokens(session);
        storeTokens(tokens);
        resolve({ status: "success", tokens });
      },
      onFailure: (err) => reject(err),
      // AUTH-02: account FORCE_CHANGE_PASSWORD -> bắt đổi mật khẩu,
      // chưa cấp token.
      newPasswordRequired: () => {
        resolve({ status: "newPasswordRequired", cognitoUser });
      },
    });
  });
}

/** AUTH-02: hoàn tất đổi mật khẩu lần đầu, đăng nhập luôn sau khi xong. */
export function completeNewPassword(
  cognitoUser: CognitoUser,
  newPassword: string,
): Promise<Tokens> {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      {},
      {
        onSuccess: (session) => {
          const tokens = extractTokens(session);
          storeTokens(tokens);
          resolve(tokens);
        },
        onFailure: (err) => reject(err),
      },
    );
  });
}

/** AUTH-06: dùng ID token (không phải access token) làm Bearer token. */
export function getIdToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.idToken);
}

export function isAuthenticated(): boolean {
  return getIdToken() !== null;
}

/** AUTH-08/AUTH-11: chỉ xoá token local — không gọi GlobalSignOut. */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.idToken);
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
}

/** Decode payload JWT — KHÔNG verify chữ ký, chỉ dùng để hiển thị FE. */
export function decodeIdToken(token: string): IdTokenPayload | null {
  try {
    const payloadBase64Url = token.split(".")[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payloadBase64)) as IdTokenPayload;
  } catch {
    return null;
  }
}

/** UI-AUTH-03-2: email + role hiển thị ở header, không có group -> member. */
export function getCurrentUser(): CurrentUser | null {
  const token = getIdToken();
  if (!token) return null;

  const payload = decodeIdToken(token);
  if (!payload) return null;

  const groups = payload["cognito:groups"] ?? [];
  return {
    email: payload.email,
    role: groups.includes("admin") ? "admin" : "member",
  };
}

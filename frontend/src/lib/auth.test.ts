import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateUserMock = vi.fn();
const completeNewPasswordChallengeMock = vi.fn();

vi.mock("amazon-cognito-identity-js", () => {
  class CognitoUserPool {
    constructor(_config: unknown) {}
  }
  class AuthenticationDetails {
    constructor(_config: unknown) {}
  }
  class CognitoUser {
    authenticateUser = authenticateUserMock;
    completeNewPasswordChallenge = completeNewPasswordChallengeMock;
  }
  return { CognitoUserPool, AuthenticationDetails, CognitoUser };
});

import {
  completeNewPassword,
  decodeIdToken,
  getCurrentUser,
  getIdToken,
  login,
  logout,
} from "./auth";

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeIdToken(payload: Record<string, unknown>): string {
  return `${base64Url({ alg: "RS256" })}.${base64Url(payload)}.signature`;
}

function makeFakeSession() {
  return {
    getIdToken: () => ({ getJwtToken: () => "id-token-value" }),
    getAccessToken: () => ({ getJwtToken: () => "access-token-value" }),
    getRefreshToken: () => ({ getToken: () => "refresh-token-value" }),
  };
}

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
    authenticateUserMock.mockReset();
    completeNewPasswordChallengeMock.mockReset();
  });

  it("stores tokens in localStorage on successful login (AUTH-07)", async () => {
    authenticateUserMock.mockImplementation((_details, callbacks) => {
      callbacks.onSuccess(makeFakeSession());
    });

    const result = await login("user@vnext.vn", "password123");

    expect(result.status).toBe("success");
    expect(getIdToken()).toBe("id-token-value");
    expect(localStorage.getItem("auth.accessToken")).toBe("access-token-value");
    expect(localStorage.getItem("auth.refreshToken")).toBe("refresh-token-value");
  });

  it("resolves with newPasswordRequired challenge without storing tokens (AUTH-02)", async () => {
    authenticateUserMock.mockImplementation((_details, callbacks) => {
      callbacks.newPasswordRequired();
    });

    const result = await login("user@vnext.vn", "temp-password");

    expect(result.status).toBe("newPasswordRequired");
    expect(getIdToken()).toBeNull();
  });

  it("rejects with the Cognito error on failed login", async () => {
    const error = new Error("NotAuthorizedException");
    authenticateUserMock.mockImplementation((_details, callbacks) => {
      callbacks.onFailure(error);
    });

    await expect(login("user@vnext.vn", "wrong")).rejects.toBe(error);
  });

  it("stores tokens after completing the new-password challenge (AUTH-02)", async () => {
    authenticateUserMock.mockImplementation((_details, callbacks) => {
      callbacks.newPasswordRequired();
    });
    completeNewPasswordChallengeMock.mockImplementation((_newPw, _attrs, callbacks) => {
      callbacks.onSuccess(makeFakeSession());
    });

    const challenge = await login("user@vnext.vn", "temp-password");
    if (challenge.status !== "newPasswordRequired") {
      throw new Error("expected a newPasswordRequired challenge");
    }

    const tokens = await completeNewPassword(challenge.cognitoUser, "NewPassw0rd");

    expect(tokens.idToken).toBe("id-token-value");
    expect(getIdToken()).toBe("id-token-value");
  });

  it("logout clears all tokens without calling Cognito (AUTH-11)", () => {
    localStorage.setItem("auth.idToken", "x");
    localStorage.setItem("auth.accessToken", "y");
    localStorage.setItem("auth.refreshToken", "z");

    logout();

    expect(getIdToken()).toBeNull();
    expect(localStorage.getItem("auth.accessToken")).toBeNull();
    expect(localStorage.getItem("auth.refreshToken")).toBeNull();
    expect(authenticateUserMock).not.toHaveBeenCalled();
    expect(completeNewPasswordChallengeMock).not.toHaveBeenCalled();
  });

  it("decodes email and cognito:groups from an ID token", () => {
    const token = makeIdToken({ email: "admin@vnext.vn", "cognito:groups": ["admin"] });

    expect(decodeIdToken(token)).toEqual({
      email: "admin@vnext.vn",
      "cognito:groups": ["admin"],
    });
  });

  it("getCurrentUser defaults role to member when no groups claim (UI-AUTH-03-2)", () => {
    localStorage.setItem("auth.idToken", makeIdToken({ email: "user@vnext.vn" }));

    expect(getCurrentUser()).toEqual({ email: "user@vnext.vn", role: "member" });
  });

  it("getCurrentUser returns admin role when cognito:groups includes admin", () => {
    localStorage.setItem(
      "auth.idToken",
      makeIdToken({ email: "admin@vnext.vn", "cognito:groups": ["admin"] }),
    );

    expect(getCurrentUser()).toEqual({ email: "admin@vnext.vn", role: "admin" });
  });

  it("getCurrentUser returns null when not logged in", () => {
    expect(getCurrentUser()).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getIdTokenMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("./auth", () => ({
  getIdToken: () => getIdTokenMock(),
  logout: () => logoutMock(),
}));

import { apiFetch } from "./apiClient";

function mockFetchResponse(status: number): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: async () => ({}),
    }),
  );
}

describe("apiFetch", () => {
  const assignMock = vi.fn();

  beforeEach(() => {
    getIdTokenMock.mockReset();
    logoutMock.mockReset();
    assignMock.mockReset();
    vi.stubGlobal("location", { ...window.location, assign: assignMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches Authorization: Bearer <idToken> when a token exists (AUTH-06)", async () => {
    getIdTokenMock.mockReturnValue("id-token-value");
    mockFetchResponse(200);

    await apiFetch("/projects");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer id-token-value");
  });

  it("does not attach Authorization header when there is no token", async () => {
    getIdTokenMock.mockReturnValue(null);
    mockFetchResponse(200);

    await apiFetch("/health");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("on 401, clears tokens and redirects to /login (AUTH-08)", async () => {
    getIdTokenMock.mockReturnValue("expired-token");
    mockFetchResponse(401);

    await apiFetch("/projects");

    expect(logoutMock).toHaveBeenCalled();
    expect(assignMock).toHaveBeenCalledWith("/login");
  });

  it("on a non-401 response, does not clear tokens or redirect", async () => {
    getIdTokenMock.mockReturnValue("id-token-value");
    mockFetchResponse(200);

    await apiFetch("/projects");

    expect(logoutMock).not.toHaveBeenCalled();
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("resolves with the underlying response", async () => {
    getIdTokenMock.mockReturnValue("id-token-value");
    mockFetchResponse(200);

    const response = await apiFetch("/projects");

    expect(response.status).toBe(200);
  });
});

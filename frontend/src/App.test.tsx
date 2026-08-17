import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const isAuthenticatedMock = vi.fn();

vi.mock("./lib/auth", () => ({
  isAuthenticated: () => isAuthenticatedMock(),
  getCurrentUser: () => ({ email: "user@vnext.vn", role: "member" }),
  logout: vi.fn(),
}));

function renderAppAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => {
    isAuthenticatedMock.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", db: "ok" }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows DB status after calling /health when authenticated", async () => {
    isAuthenticatedMock.mockReturnValue(true);
    renderAppAt("/");

    await waitFor(() => {
      expect(screen.getByText("DB: ok")).toBeInTheDocument();
    });
  });

  it("redirects unauthenticated users to /login (UI-AUTH-03-1)", () => {
    isAuthenticatedMock.mockReturnValue(false);
    renderAppAt("/");

    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument();
  });
});

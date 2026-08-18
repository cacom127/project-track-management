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

vi.mock("./lib/projectsApi", () => ({
  listProjects: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 }),
  listTechTags: vi.fn().mockResolvedValue([]),
  createProject: vi.fn(),
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

  it("renders the project list screen at /projects when authenticated", async () => {
    isAuthenticatedMock.mockReturnValue(true);
    renderAppAt("/projects");

    expect(await screen.findByText("プロジェクトが見つかりません")).toBeInTheDocument();
  });

  it("renders the project create screen at /projects/new when authenticated", () => {
    isAuthenticatedMock.mockReturnValue(true);
    renderAppAt("/projects/new");

    expect(screen.getByRole("heading", { name: "新規プロジェクト" })).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from /projects", () => {
    isAuthenticatedMock.mockReturnValue(false);
    renderAppAt("/projects");

    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
  });

  it("renders the sidebar with プロジェクト一覧 on every authenticated route (UI-SHELL-01)", async () => {
    isAuthenticatedMock.mockReturnValue(true);
    renderAppAt("/");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "プロジェクト一覧" })).toBeInTheDocument();
    });
  });

  it("marks the sidebar item active on /projects (UI-SHELL-02)", async () => {
    isAuthenticatedMock.mockReturnValue(true);
    renderAppAt("/projects");

    const link = await screen.findByRole("link", { name: "プロジェクト一覧" });
    expect(link.className).toContain("sidebar-item-active");
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/auth", () => ({
  getCurrentUser: () => ({ email: "user@vnext.vn", role: "member" }),
  logout: vi.fn(),
}));

import AppShell from "./AppShell";

describe("AppShell", () => {
  it("renders Header, Sidebar, and children content", () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>Nội dung trang</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("user@vnext.vn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "プロジェクト一覧" })).toBeInTheDocument();
    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
  });
});

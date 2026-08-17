import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

const getCurrentUserMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("../lib/auth", () => ({
  getCurrentUser: () => getCurrentUserMock(),
  logout: () => logoutMock(),
}));

function renderHeader() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/login" element={<p>LOGIN_PAGE</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    logoutMock.mockReset();
  });

  it("shows email and role (UI-AUTH-03-2)", () => {
    getCurrentUserMock.mockReturnValue({ email: "user@vnext.vn", role: "member" });
    renderHeader();

    expect(screen.getByText("user@vnext.vn")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("shows admin role when user is in the admin group", () => {
    getCurrentUserMock.mockReturnValue({ email: "admin@vnext.vn", role: "admin" });
    renderHeader();

    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("logout clears tokens and navigates to /login (UI-AUTH-03-3)", () => {
    getCurrentUserMock.mockReturnValue({ email: "user@vnext.vn", role: "admin" });
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(logoutMock).toHaveBeenCalled();
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });
});

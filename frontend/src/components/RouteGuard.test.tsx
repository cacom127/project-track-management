import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import RouteGuard from "./RouteGuard";

const isAuthenticatedMock = vi.fn();

vi.mock("../lib/auth", () => ({
  isAuthenticated: () => isAuthenticatedMock(),
}));

function renderApp() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <RouteGuard>
              <p>PROTECTED_CONTENT</p>
            </RouteGuard>
          }
        />
        <Route path="/login" element={<p>LOGIN_PAGE</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RouteGuard", () => {
  it("renders children when authenticated", () => {
    isAuthenticatedMock.mockReturnValue(true);
    renderApp();

    expect(screen.getByText("PROTECTED_CONTENT")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated (UI-AUTH-03-1)", () => {
    isAuthenticatedMock.mockReturnValue(false);
    renderApp();

    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED_CONTENT")).not.toBeInTheDocument();
  });
});

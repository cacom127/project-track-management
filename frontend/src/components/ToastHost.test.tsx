import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastHost from "./ToastHost";

function renderToastHost(state?: Record<string, unknown>) {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/projects", state }]}>
      <ToastHost />
    </MemoryRouter>,
  );
}

describe("ToastHost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there is no successMessage (UI-SHELL-04)", () => {
    renderToastHost(undefined);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the successMessage as a .toast-success banner (UI-SHELL-04)", () => {
    renderToastHost({ successMessage: "「サンプル案件」を作成しました" });

    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("toast-success");
    expect(toast).toHaveTextContent("「サンプル案件」を作成しました");
  });

  it("auto-dismisses the toast after 3000ms (UI-SHELL-04)", () => {
    renderToastHost({ successMessage: "「サンプル案件」を作成しました" });

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

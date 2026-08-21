import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import Sidebar from "./Sidebar";

function renderSidebar(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  it("renders プロジェクト一覧 link to /projects (UI-SHELL-01)", () => {
    renderSidebar("/");

    const link = screen.getByRole("link", { name: "プロジェクト一覧" });
    expect(link.getAttribute("href")).toBe("/projects");
  });

  it("marks the item active when route is /projects (UI-SHELL-02)", () => {
    renderSidebar("/projects");

    const link = screen.getByRole("link", { name: "プロジェクト一覧" });
    expect(link.className).toContain("sidebar-item");
    expect(link.className).toContain("sidebar-item-active");
  });

  it("does not mark the item active when route is / (UI-SHELL-02)", () => {
    renderSidebar("/");

    const link = screen.getByRole("link", { name: "プロジェクト一覧" });
    expect(link.className).toContain("sidebar-item");
    expect(link.className).not.toContain("sidebar-item-active");
  });

  it("renders the VPM logo header, text-free (ARCH-SHELL-02)", () => {
    renderSidebar("/");

    const logo = screen.getByRole("img", { name: "VPM" });
    expect(logo.getAttribute("src")).toBe("/logo.png");
  });

  it("renders an icon next to the nav item label (ARCH-SHELL-03)", () => {
    renderSidebar("/");

    const link = screen.getByRole("link", { name: "プロジェクト一覧" });
    expect(link.querySelector("svg.sidebar-item-icon")).not.toBeNull();
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import ProjectCard from "./ProjectCard";
import type { Project } from "../lib/projectsApi";

const BASE_PROJECT: Project = {
  id: 42,
  customer_name: "ABC商事",
  project_name: "基幹システム刷新",
  description: "説明文",
  start_date: "2024-01-01",
  end_date: null,
  is_ongoing: true,
  team_size: 5,
  total_man_month: 12.5,
  source_note: null,
  created_by: "user-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  technologies: ["React", "AWS", "TypeScript", "Node.js", "PostgreSQL"],
  project_types: ["offshore", "lab"],
  industry: "製造業",
  outcome_note: null,
  dev_process_phases: ["requirements", "testing"],
  team_composition_note: null,
};

function renderCard(overrides: Partial<Project> = {}) {
  return render(
    <MemoryRouter>
      <ProjectCard project={{ ...BASE_PROJECT, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("ProjectCard", () => {
  it("links the whole card to the project's Detail page (UI-PROJ-01-18)", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/42");
  });

  it("shows customer name/industry and the project name", () => {
    renderCard();
    expect(screen.getByText("ABC商事")).toBeInTheDocument();
    expect(screen.getByText("製造業")).toBeInTheDocument();
    expect(screen.getByText("基幹システム刷新")).toBeInTheDocument();
  });

  it("shows an ongoing status badge when is_ongoing is true", () => {
    renderCard({ is_ongoing: true });
    expect(screen.getByText("進行中")).toHaveClass("project-card-status-ongoing");
  });

  it("shows an ended status badge when is_ongoing is false", () => {
    renderCard({ is_ongoing: false, end_date: "2024-06-01" });
    expect(screen.getByText("終了")).toHaveClass("project-card-status-ended");
  });

  it("renders dev_process_phases as phase badges", () => {
    renderCard();
    expect(screen.getByText("要件定義")).toHaveClass("badge-phase");
    expect(screen.getByText("テスト")).toHaveClass("badge-phase");
  });

  it("hides the dev_process_phases row when empty", () => {
    const { container } = renderCard({ dev_process_phases: [] });
    expect(container.querySelector(".project-card-dev-process")).not.toBeInTheDocument();
  });

  it("shows at most 4 technology badges plus a +N indicator", () => {
    renderCard();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.queryByText("PostgreSQL")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("shows project_types as dot badges", () => {
    renderCard();
    expect(screen.getByText("● オフショア")).toBeInTheDocument();
    expect(screen.getByText("● ラボ")).toBeInTheDocument();
  });

  it("shows team_size/total_man_month, falling back to — when null", () => {
    renderCard({ team_size: null, total_man_month: null });
    expect(screen.getByText("—名")).toBeInTheDocument();
    expect(screen.getByText("—人月")).toBeInTheDocument();
  });
});

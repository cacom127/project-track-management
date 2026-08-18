import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProjectMock = vi.fn();
const updateProjectMock = vi.fn();
const listTechTagsMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../lib/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/projectsApi")>();
  return {
    ...actual,
    getProject: (...args: unknown[]) => getProjectMock(...args),
    updateProject: (...args: unknown[]) => updateProjectMock(...args),
    listTechTags: (...args: unknown[]) => listTechTagsMock(...args),
  };
});

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import ProjectEdit from "./ProjectEdit";

const SAMPLE_PROJECT = {
  id: 1,
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
  technologies: ["React"],
  project_types: ["offshore"],
};

function renderEdit() {
  return render(
    <MemoryRouter initialEntries={["/projects/1/edit"]}>
      <Routes>
        <Route path="/projects/:id/edit" element={<ProjectEdit />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProjectEdit", () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    updateProjectMock.mockReset();
    listTechTagsMock.mockReset();
    navigateMock.mockReset();
    listTechTagsMock.mockResolvedValue([]);
  });

  it("pre-fills the form with fetched values (UI-PROJ-04-1)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderEdit();

    expect(await screen.findByLabelText("顧客名 *")).toHaveValue("ABC商事");
    expect(screen.getByLabelText("プロジェクト名 *")).toHaveValue("基幹システム刷新");
    expect(screen.getByLabelText("進行中")).toBeChecked();
    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
  });

  it("submits and navigates to /projects/:id with a success toast (UI-PROJ-04-2)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    updateProjectMock.mockResolvedValue({ id: 1, project_name: "基幹システム刷新" });
    renderEdit();

    await screen.findByLabelText("顧客名 *");
    fireEvent.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => expect(updateProjectMock).toHaveBeenCalledWith(1, expect.any(Object)));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/projects/1", {
        state: { successMessage: "「基幹システム刷新」を更新しました" },
      }),
    );
  });

  it("blocks submit when a required field is cleared, reusing Create validation (UI-PROJ-04-3)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderEdit();

    const customerInput = await screen.findByLabelText("顧客名 *");
    fireEvent.change(customerInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "更新する" }));

    expect(await screen.findByText("顧客名は必須です")).toBeInTheDocument();
    expect(updateProjectMock).not.toHaveBeenCalled();
  });
});

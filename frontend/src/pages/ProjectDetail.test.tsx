import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProjectMock = vi.fn();
const deleteProjectMock = vi.fn();
const navigateMock = vi.fn();

// KHÔNG dùng importOriginal: module thật ("../lib/projectsApi") import
// tới "../lib/auth" -> khởi tạo CognitoUserPool ngay lúc load module,
// lỗi ở CI (không có env Cognito) dù local có .env. Định nghĩa
// ProjectNotFoundError riêng trong factory, không cần class gốc.
vi.mock("../lib/projectsApi", () => ({
  getProject: (...args: unknown[]) => getProjectMock(...args),
  deleteProject: (...args: unknown[]) => deleteProjectMock(...args),
  ProjectNotFoundError: class ProjectNotFoundError extends Error {},
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import ProjectDetail from "./ProjectDetail";

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

function renderDetail(id = "1") {
  return render(
    <MemoryRouter initialEntries={[`/projects/${id}`]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProjectDetail", () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    deleteProjectMock.mockReset();
    navigateMock.mockReset();
  });

  it("calls getProject on mount and shows loaded fields (UI-PROJ-03-1)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    expect(await screen.findByRole("heading", { name: "基幹システム刷新" })).toBeInTheDocument();
    expect(getProjectMock).toHaveBeenCalledWith(1);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("shows not-found message with a link back on 404 (UI-PROJ-03-2)", async () => {
    const { ProjectNotFoundError } = await import("../lib/projectsApi");
    getProjectMock.mockRejectedValue(new ProjectNotFoundError("not found"));
    renderDetail();

    expect(await screen.findByText("プロジェクトが見つかりません")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "プロジェクト一覧へ戻る" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("renders fields read-only grouped into 3 sections (UI-PROJ-03-3)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.getByText("基本情報")).toBeInTheDocument();
    expect(screen.getByText("期間・規模")).toBeInTheDocument();
    expect(screen.getByText("分類")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("opens a confirm modal when clicking 削除 (UI-PROJ-03-4)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(deleteProjectMock).not.toHaveBeenCalled();
  });

  it("deletes and navigates to /projects with a success toast on confirm (UI-PROJ-03-5)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    deleteProjectMock.mockResolvedValue(undefined);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => expect(deleteProjectMock).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/projects", {
        state: { successMessage: "「基幹システム刷新」を削除しました" },
      }),
    );
  });
});

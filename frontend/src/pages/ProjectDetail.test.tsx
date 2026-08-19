import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProjectMock = vi.fn();
const deleteProjectMock = vi.fn();
const navigateMock = vi.fn();
const listAttachmentsMock = vi.fn();

// KHÔNG dùng importOriginal: module thật ("../lib/projectsApi") import
// tới "../lib/auth" -> khởi tạo CognitoUserPool ngay lúc load module,
// lỗi ở CI (không có env Cognito) dù local có .env. Định nghĩa
// ProjectNotFoundError riêng trong factory, không cần class gốc.
vi.mock("../lib/projectsApi", () => ({
  getProject: (...args: unknown[]) => getProjectMock(...args),
  deleteProject: (...args: unknown[]) => deleteProjectMock(...args),
  ProjectNotFoundError: class ProjectNotFoundError extends Error {},
}));

// Detail render AttachmentManager mode "live" -> cần mock riêng, cùng
// lý do CognitoUserPool ở trên.
vi.mock("../lib/attachmentsApi", () => ({
  ALLOWED_ATTACHMENT_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_ATTACHMENTS: 10,
  MAX_ATTACHMENT_SIZE_BYTES: 5 * 1024 * 1024,
  listAttachments: (...args: unknown[]) => listAttachmentsMock(...args),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
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
  industry: "製造業",
  outcome_note: "納期通りリリースできた",
  dev_process_phases: ["requirements", "testing"],
  team_composition_note: "PM 1名、開発者 3名",
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
    listAttachmentsMock.mockReset();
    listAttachmentsMock.mockResolvedValue([]);
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

  it("renders attachments read-only — no add button (feedback CHANGE-011)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.queryByRole("button", { name: "+ 画像を選択" })).not.toBeInTheDocument();
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

  it("renders industry/dev_process_phases/outcome_note read-only (UI-PROJ-03-6)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.getByText("業種: 製造業")).toBeInTheDocument();
    expect(screen.getByText("要件定義")).toBeInTheDocument();
    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.getByText("成果・課題・解決策: 納期通りリリースできた")).toBeInTheDocument();
  });

  it("renders team_composition_note read-only (CHANGE-013)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.getByText("チーム体制の詳細: PM 1名、開発者 3名")).toBeInTheDocument();
  });

  it("groups 成果・課題・解決策/確認元メモ into a その他 section (UI-PROJ-03-9, CHANGE-014)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("renders multi-line free-text fields as a bullet list (UI-PROJ-03-8, CHANGE-014)", async () => {
    getProjectMock.mockResolvedValue({
      ...SAMPLE_PROJECT,
      outcome_note: "課題：A\n解決策：B\n成果：C",
    });
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("課題：A")).toBeInTheDocument();
    expect(screen.getByText("成果：C")).toBeInTheDocument();
  });

  it("renders 開発工程 badge with a distinct color from 種別 (UI-PROJ-03-10, CHANGE-014)", async () => {
    getProjectMock.mockResolvedValue(SAMPLE_PROJECT);
    renderDetail();

    await screen.findByRole("heading", { name: "基幹システム刷新" });
    expect(screen.getByText("要件定義")).toHaveClass("badge-phase");
    expect(screen.getByText("要件定義")).not.toHaveClass("badge-type");
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

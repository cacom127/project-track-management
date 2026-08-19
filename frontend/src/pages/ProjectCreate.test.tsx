import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createProjectMock = vi.fn();
const listTechTagsMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../lib/projectsApi", () => ({
  createProject: (...args: unknown[]) => createProjectMock(...args),
  listTechTags: (...args: unknown[]) => listTechTagsMock(...args),
}));

// KHÔNG dùng importOriginal: ProjectForm render AttachmentManager (mode
// "staged" ở Create) -> import tĩnh "../lib/attachmentsApi" ->
// "./apiClient" -> "./auth" khởi tạo CognitoUserPool ngay lúc import,
// lỗi ở CI (không có env Cognito) dù mode staged không gọi API nào.
vi.mock("../lib/attachmentsApi", () => ({
  ALLOWED_ATTACHMENT_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_ATTACHMENTS: 10,
  MAX_ATTACHMENT_SIZE_BYTES: 5 * 1024 * 1024,
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import ProjectCreate from "./ProjectCreate";

function renderCreate() {
  return render(
    <MemoryRouter>
      <ProjectCreate />
    </MemoryRouter>,
  );
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("顧客名 *"), { target: { value: "ABC商事" } });
  fireEvent.change(screen.getByLabelText("プロジェクト名 *"), {
    target: { value: "基幹システム刷新" },
  });
  fireEvent.change(screen.getByLabelText("開始日 *"), { target: { value: "2024-01-01" } });
}

describe("ProjectCreate", () => {
  beforeEach(() => {
    createProjectMock.mockReset();
    listTechTagsMock.mockReset();
    navigateMock.mockReset();
    listTechTagsMock.mockResolvedValue([]);
  });

  it("checking 進行中 disables and clears 終了日 (UI-PROJ-02-1)", () => {
    renderCreate();

    const endDateInput = screen.getByLabelText("終了日") as HTMLInputElement;
    fireEvent.change(endDateInput, { target: { value: "2024-12-31" } });
    expect(endDateInput.value).toBe("2024-12-31");

    fireEvent.click(screen.getByLabelText("進行中"));

    expect(endDateInput).toBeDisabled();
    expect(endDateInput.value).toBe("");
  });

  it("blocks submit and shows inline error when a required field is missing (UI-PROJ-02-2)", async () => {
    renderCreate();

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByText("顧客名は必須です")).toBeInTheDocument();
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("calls tech-tags autocomplete while typing and adds a selected suggestion (UI-PROJ-02-3)", async () => {
    listTechTagsMock.mockResolvedValue(["React"]);
    renderCreate();

    fireEvent.change(screen.getByLabelText("技術"), { target: { value: "rea" } });

    await waitFor(() => expect(listTechTagsMock).toHaveBeenCalledWith("rea"));
    fireEvent.click(await screen.findByRole("button", { name: "React" }));

    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("submits successfully and navigates to /projects with a success toast (UI-PROJ-02-4)", async () => {
    createProjectMock.mockResolvedValue({ id: 1, project_name: "基幹システム刷新" });
    renderCreate();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/projects", {
        state: { successMessage: "「基幹システム刷新」を作成しました" },
      }),
    );
    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_name: "ABC商事",
        project_name: "基幹システム刷新",
        start_date: "2024-01-01",
      }),
    );
  });

  it("disables inputs and button while submitting", async () => {
    let resolveCreate!: (value: unknown) => void;
    createProjectMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderCreate();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() => {
      expect(screen.getByLabelText("顧客名 *")).toBeDisabled();
      expect(screen.getByRole("button", { name: "作成する" })).toBeDisabled();
    });

    resolveCreate({ id: 1 });
  });

  it("shows a toast and keeps form data on server error", async () => {
    createProjectMock.mockRejectedValue(new Error("boom"));
    renderCreate();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByText("プロジェクトの作成に失敗しました")).toBeInTheDocument();
    expect(screen.getByLabelText("顧客名 *")).toHaveValue("ABC商事");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("renders required field asterisk in error color (UI-PROJ-02-5)", () => {
    renderCreate();

    const marks = screen.getAllByText("*");
    expect(marks.length).toBeGreaterThan(0);
    marks.forEach((mark) => expect(mark).toHaveClass("required-mark"));
  });

  it("groups fields into 3 sections (UI-PROJ-02-6)", () => {
    renderCreate();

    expect(screen.getByText("基本情報")).toBeInTheDocument();
    expect(screen.getByText("期間・規模")).toBeInTheDocument();
    expect(screen.getByText("分類")).toBeInTheDocument();
  });

  it("shows unit labels next to team_size/total_man_month inputs (UI-PROJ-02-7)", () => {
    renderCreate();

    expect(screen.getByText("名")).toBeInTheDocument();
    expect(screen.getByText("人月")).toBeInTheDocument();
  });

  it("renders a キャンセル link to /projects that does not submit (UI-PROJ-02-8)", () => {
    renderCreate();

    const cancelLink = screen.getByRole("link", { name: "キャンセル" });
    expect(cancelLink).toHaveAttribute("href", "/projects");
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("renders 業種 input, 開発工程 checkboxes and 成果・課題・解決策 textarea, and submits them (UI-PROJ-02-12/13)", async () => {
    createProjectMock.mockResolvedValue({ id: 1, project_name: "基幹システム刷新" });
    renderCreate();
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText("業種"), { target: { value: "製造業" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "要件定義" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "テスト" }));
    fireEvent.change(screen.getByLabelText("成果・課題・解決策"), {
      target: { value: "納期通りリリースできた" },
    });

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() => expect(createProjectMock).toHaveBeenCalled());
    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        industry: "製造業",
        dev_process_phases: ["requirements", "testing"],
        outcome_note: "納期通りリリースできた",
      }),
    );
  });

  it("calls preventDefault on Enter keydown inside a text input, so the browser cannot auto-submit (UI-PROJ-02-15, CHANGE-014)", () => {
    renderCreate();
    fillRequiredFields();

    // jsdom không tự implicit-submit form khi Enter (khác browser thật),
    // nên assert qua giá trị trả về của dispatchEvent (fireEvent) — false
    // nghĩa là preventDefault() đã được gọi, đúng hành vi cần kiểm tra.
    const notCancelled = fireEvent.keyDown(screen.getByLabelText("顧客名 *"), {
      key: "Enter",
      code: "Enter",
    });

    expect(notCancelled).toBe(false);
  });

  it("renders チーム体制の詳細 textarea and submits it (CHANGE-013)", async () => {
    createProjectMock.mockResolvedValue({ id: 1, project_name: "基幹システム刷新" });
    renderCreate();
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText("チーム体制の詳細"), {
      target: { value: "PM 1名、開発者 3名" },
    });

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() => expect(createProjectMock).toHaveBeenCalled());
    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        team_composition_note: "PM 1名、開発者 3名",
      }),
    );
  });
});

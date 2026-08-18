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

vi.mock("../lib/auth", () => ({
  getCurrentUser: () => ({ email: "user@vnext.vn", role: "member" }),
  logout: vi.fn(),
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

  it("submits successfully and navigates to /projects (UI-PROJ-02-4)", async () => {
    createProjectMock.mockResolvedValue({ id: 1 });
    renderCreate();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/projects"));
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
});

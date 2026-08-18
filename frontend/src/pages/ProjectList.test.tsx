import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listProjectsMock = vi.fn();
const listTechTagsMock = vi.fn();

vi.mock("../lib/projectsApi", () => ({
  listProjects: (...args: unknown[]) => listProjectsMock(...args),
  listTechTags: (...args: unknown[]) => listTechTagsMock(...args),
}));

import ProjectList from "./ProjectList";

function renderList() {
  return render(
    <MemoryRouter>
      <ProjectList />
    </MemoryRouter>,
  );
}

const SAMPLE_PROJECT = {
  id: 1,
  customer_name: "ABC商事",
  project_name: "基幹システム刷新",
  description:
    "とても長い説明文がここに入る想定で1行に収まらないくらいの長さのテキストを入れてみます",
  start_date: "2024-01-01",
  end_date: null,
  is_ongoing: true,
  team_size: null,
  total_man_month: null,
  source_note: null,
  created_by: "user-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  technologies: ["React", "AWS"],
  project_types: ["offshore"],
};

describe("ProjectList", () => {
  beforeEach(() => {
    listProjectsMock.mockReset();
    listTechTagsMock.mockReset();
    listTechTagsMock.mockResolvedValue(["React", "AWS"]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls listProjects on mount and shows loaded rows (UI-PROJ-01-1)", async () => {
    listProjectsMock.mockResolvedValue({
      items: [SAMPLE_PROJECT],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderList();

    await waitFor(() => expect(listProjectsMock).toHaveBeenCalled());
    expect(await screen.findByText("基幹システム刷新")).toBeInTheDocument();
  });

  it("shows empty state when total is 0 (UI-PROJ-01-4)", async () => {
    listProjectsMock.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });

    renderList();

    expect(await screen.findByText("プロジェクトが見つかりません")).toBeInTheDocument();
  });

  it("shows error toast when the API call fails", async () => {
    listProjectsMock.mockRejectedValue(new Error("boom"));

    renderList();

    expect(await screen.findByText("プロジェクト一覧の取得に失敗しました")).toBeInTheDocument();
  });

  it("renders 8 columns, showing — for null team_size/total_man_month (UI-PROJ-01-5)", async () => {
    listProjectsMock.mockResolvedValue({
      items: [SAMPLE_PROJECT],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderList();

    await screen.findByText("基幹システム刷新");
    const row = screen.getByText("基幹システム刷新").closest("tr");
    expect(row).not.toBeNull();
    const cells = row!.querySelectorAll("td");
    expect(cells).toHaveLength(8);
    expect(row!.textContent).toContain("—");
  });

  it("debounces search input 300ms before calling the API again (UI-PROJ-01-2)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listProjectsMock.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });

    renderList();
    await act(async () => {
      await Promise.resolve();
    });
    listProjectsMock.mockClear();

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "Sony" } });

    // Chưa đủ 300ms -> chưa gọi thêm lần nào
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(listProjectsMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(150);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(listProjectsMock).toHaveBeenCalledWith(expect.objectContaining({ q: "Sony", page: 1 }));
  });

  it("resets to page 1 when technology filter changes (UI-PROJ-01-3)", async () => {
    listProjectsMock.mockResolvedValue({
      items: [SAMPLE_PROJECT],
      total: 30,
      page: 1,
      page_size: 20,
    });

    renderList();
    await screen.findByText("基幹システム刷新");

    fireEvent.click(await screen.findByRole("button", { name: "次へ" }));
    await waitFor(() =>
      expect(listProjectsMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );

    listProjectsMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "技術" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "React" }));

    await waitFor(() =>
      expect(listProjectsMock).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, technology: ["React"] }),
      ),
    );
  });

  it("renders 種別/技術 as individual badges, not a comma-joined string (UI-PROJ-01-9)", async () => {
    listProjectsMock.mockResolvedValue({
      items: [SAMPLE_PROJECT],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderList();
    await screen.findByText("基幹システム刷新");

    expect(screen.getByText("React")).toHaveClass("badge-tech");
    expect(screen.getByText("AWS")).toHaveClass("badge-tech");
    expect(screen.getByText("オフショア")).toHaveClass("badge-type");
  });

  it("renders title row separate from the toolbar row (UI-PROJ-01-6)", async () => {
    listProjectsMock.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });

    renderList();

    expect(screen.getByRole("heading", { name: "プロジェクト" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ 新規プロジェクト" })).toBeInTheDocument();
  });
});

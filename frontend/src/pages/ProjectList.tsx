import { useEffect, useState } from "react";
import { Link } from "react-router";
import Badge from "../components/Badge";
import FilterDropdown from "../components/FilterDropdown";
import { exportProjects, listProjects, listTechTags, type Project } from "../lib/projectsApi";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_OPTIONS } from "../lib/projectTypes";
import { DEV_PROCESS_PHASE_LABELS, DEV_PROCESS_PHASE_OPTIONS } from "../lib/devProcessPhases";
import { formatPeriod } from "../lib/formatPeriod";
import ProjectCard from "../components/ProjectCard";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const VIEW_MODE_STORAGE_KEY = "projectListViewMode";
// EXPORT-03/UI-PROJ-01-21/22 (CHANGE-017) — trần cứng phía BE, UI chặn
// trước để tránh gọi API rồi nhận 400.
const MAX_EXPORT_PROJECTS = 10;

type Status = "loading" | "loaded" | "error";
type ViewMode = "list" | "card";

// UI-PROJ-01-16 (SỬA — CHANGE-015): mặc định "card" khi chưa có lựa
// chọn lưu trong localStorage (trước đó mặc định "list").
function readStoredViewMode(): ViewMode {
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

export function ProjectList() {
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [technology, setTechnology] = useState<string[]>([]);
  const [projectType, setProjectType] = useState<string[]>([]);
  const [devProcessPhase, setDevProcessPhase] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [techOptions, setTechOptions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  // UI-PROJ-01-19..22 (CHANGE-017) — chọn nhiều dự án để export, giữ
  // nguyên khi đổi trang/filter (state React sống theo component, không
  // cần localStorage — chỉ mất khi rời màn hình).
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage không khả dụng (vd private mode) — bỏ qua, chỉ
      // mất khả năng nhớ lựa chọn, không ảnh hưởng chức năng chính.
    }
  }

  // UI-PROJ-01-2: debounce 300ms trước khi cập nhật query search thật.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    listTechTags()
      .then(setTechOptions)
      .catch(() => setTechOptions([]));
  }, []);

  // UI-PROJ-01-1: gọi API khi mount / đổi trang / đổi filter.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    listProjects({
      page,
      page_size: PAGE_SIZE,
      q: debouncedQ || undefined,
      technology: technology.length ? technology : undefined,
      project_type: projectType.length ? projectType : undefined,
      dev_process_phase: devProcessPhase.length ? devProcessPhase : undefined,
    })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, technology, projectType, devProcessPhase]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleTechnologyChange(selected: string[]) {
    setTechnology(selected);
    setPage(1);
  }

  function handleProjectTypeChange(selected: string[]) {
    setProjectType(selected);
    setPage(1);
  }

  function handleDevProcessPhaseChange(selected: string[]) {
    setDevProcessPhase(selected);
    setPage(1);
  }

  // UI-PROJ-01-14: 1 chip / giá trị đơn lẻ (không phải 1 chip / nhóm),
  // để xoá riêng từng điều kiện mà không mất các điều kiện khác.
  type FilterChip = { key: string; label: string; colorClass: string; onRemove: () => void };
  const chips: FilterChip[] = [];
  if (q) {
    chips.push({
      key: "q",
      label: `"${q}"`,
      colorClass: "filter-chip-search",
      onRemove: () => setQ(""),
    });
  }
  technology.forEach((tech) => {
    chips.push({
      key: `tech-${tech}`,
      label: tech,
      colorClass: "filter-chip-tech",
      onRemove: () => handleTechnologyChange(technology.filter((v) => v !== tech)),
    });
  });
  projectType.forEach((code) => {
    chips.push({
      key: `type-${code}`,
      label: PROJECT_TYPE_LABELS[code] ?? code,
      colorClass: "filter-chip-type",
      onRemove: () => handleProjectTypeChange(projectType.filter((v) => v !== code)),
    });
  });
  devProcessPhase.forEach((code) => {
    chips.push({
      key: `phase-${code}`,
      label: DEV_PROCESS_PHASE_LABELS[code] ?? code,
      colorClass: "filter-chip-phase",
      onRemove: () => handleDevProcessPhaseChange(devProcessPhase.filter((v) => v !== code)),
    });
  });

  function clearAllFilters() {
    setQ("");
    setTechnology([]);
    setProjectType([]);
    setDevProcessPhase([]);
    setPage(1);
  }

  // UI-PROJ-01-19: toggle chọn/bỏ chọn 1 dự án.
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const unselectedOnPage = items.filter((project) => !selectedIds.has(project.id)).length;
  const allOnPageSelected = items.length > 0 && unselectedOnPage === 0;
  // UI-PROJ-01-22: chặn TRƯỚC khi click nếu chọn hết trang này sẽ vượt
  // giới hạn — không tự động chỉ chọn 10 dòng đầu.
  const selectAllDisabled =
    !allOnPageSelected && unselectedOnPage + selectedIds.size > MAX_EXPORT_PROJECTS;

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        items.forEach((project) => next.delete(project.id));
      } else {
        items.forEach((project) => next.add(project.id));
      }
      return next;
    });
  }

  // UI-PROJ-01-20: gọi API export, trigger download qua presigned URL.
  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const { download_url } = await exportProjects([...selectedIds]);
      window.location.href = download_url;
    } catch {
      setExportError("プロジェクトのエクスポートに失敗しました");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="app-page">
      {/* UI-PROJ-01-6: title + nút hành động chính tách riêng khỏi toolbar */}
      <div className="page-header-row">
        <h1>プロジェクト</h1>
        <Link to="/projects/new" className="button-primary">
          + 新規プロジェクト
        </Link>
      </div>

      <div className="project-list-toolbar">
        {/* UI-PROJ-01-7: width cố định, không giãn hết toolbar */}
        <div className="search-box">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <input
            type="search"
            role="searchbox"
            aria-label="検索"
            placeholder="検索..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>
        {/* UI-PROJ-01-8: dropdown + checkbox thay <select multiple> */}
        <FilterDropdown
          label="技術"
          options={techOptions.map((tech) => ({ value: tech, label: tech }))}
          value={technology}
          onChange={handleTechnologyChange}
        />
        <FilterDropdown
          label="種別"
          options={PROJECT_TYPE_OPTIONS.map(({ code, label }) => ({ value: code, label }))}
          value={projectType}
          onChange={handleProjectTypeChange}
        />
        <FilterDropdown
          label="開発工程"
          options={DEV_PROCESS_PHASE_OPTIONS.map(({ code, label }) => ({ value: code, label }))}
          value={devProcessPhase}
          onChange={handleDevProcessPhaseChange}
        />
        {/* UI-PROJ-01-19/22: chọn tất cả dự án trên trang hiện tại */}
        <label className="select-all-on-page">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            disabled={selectAllDisabled}
            onChange={toggleSelectAllOnPage}
            aria-label="このページのすべてを選択"
          />
          このページを選択
        </label>
        {/* UI-PROJ-01-20: export dự án đã chọn ra .pptx (CHANGE-017) */}
        <button
          type="button"
          className="button-primary"
          disabled={selectedIds.size === 0 || exporting}
          onClick={handleExport}
        >
          {exporting ? "エクスポート中..." : `エクスポート (${selectedIds.size})`}
        </button>
        {/* UI-PROJ-01-15: toggle hiển thị list/card */}
        <div className="view-mode-toggle">
          <button
            type="button"
            className={viewMode === "list" ? "view-mode-button active" : "view-mode-button"}
            aria-label="リスト表示"
            aria-pressed={viewMode === "list"}
            onClick={() => changeViewMode("list")}
          >
            ☰
          </button>
          <button
            type="button"
            className={viewMode === "card" ? "view-mode-button active" : "view-mode-button"}
            aria-label="カード表示"
            aria-pressed={viewMode === "card"}
            onClick={() => changeViewMode("card")}
          >
            ⊞
          </button>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="filter-chip-row">
          {chips.map((chip) => (
            <span key={chip.key} className={`filter-chip ${chip.colorClass}`}>
              {chip.label}
              <button type="button" onClick={chip.onRemove} aria-label={`${chip.label}を解除`}>
                ✕
              </button>
            </span>
          ))}
          <button type="button" className="filter-clear-all" onClick={clearAllFilters}>
            すべてクリア
          </button>
        </div>
      )}

      {status === "loaded" && total > 0 && <p className="project-list-count">{total}件</p>}

      {/* UI-PROJ-01-21: thông báo khi đã chọn đủ 10 dự án */}
      {selectedIds.size >= MAX_EXPORT_PROJECTS && (
        <p className="project-list-limit-message">最大{MAX_EXPORT_PROJECTS}件まで選択できます</p>
      )}

      {exportError && (
        <p className="toast-error" role="alert">
          {exportError}
        </p>
      )}

      {status === "error" && (
        <p className="toast-error" role="alert">
          プロジェクト一覧の取得に失敗しました
        </p>
      )}

      {status === "loading" && <p role="status">読み込み中...</p>}

      {status === "loaded" && total === 0 && <p>プロジェクトが見つかりません</p>}

      {status === "loaded" && total > 0 && viewMode === "card" && (
        <div className="project-card-grid">
          {items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              selected={selectedIds.has(project.id)}
              selectionDisabled={
                !selectedIds.has(project.id) && selectedIds.size >= MAX_EXPORT_PROJECTS
              }
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {status === "loaded" && total > 0 && viewMode === "list" && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>顧客名</th>
                <th>プロジェクト名</th>
                <th>概要</th>
                <th>期間</th>
                <th>種別</th>
                <th>技術</th>
                <th>人数</th>
                <th>総人月</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((project) => (
                <tr key={project.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(project.id)}
                      disabled={
                        !selectedIds.has(project.id) && selectedIds.size >= MAX_EXPORT_PROJECTS
                      }
                      onChange={() => toggleSelect(project.id)}
                      aria-label={`${project.project_name}を選択`}
                    />
                  </td>
                  <td>{project.customer_name}</td>
                  <td>{project.project_name}</td>
                  <td className="project-list-description">{project.description}</td>
                  <td>{formatPeriod(project)}</td>
                  <td>
                    {/* UI-PROJ-01-9: mỗi giá trị 1 badge riêng, không nối chuỗi */}
                    {project.project_types.map((t) => (
                      <Badge key={t} variant="type">
                        {PROJECT_TYPE_LABELS[t] ?? t}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="tech">
                        {tech}
                      </Badge>
                    ))}
                  </td>
                  <td>{project.team_size ?? "—"}</td>
                  <td>{project.total_man_month ?? "—"}</td>
                  <td>
                    {/* UI-PROJ-01-10 — icon thay cho link chữ (feedback
                          CHANGE-010), accessible name giữ nguyên "詳細". */}
                    <Link
                      to={`/projects/${project.id}`}
                      className="row-action-link"
                      aria-label="詳細"
                    >
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status === "loaded" && total > 0 && (
        <div className="project-list-pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            前へ
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            次へ
          </button>
        </div>
      )}
    </main>
  );
}

export default ProjectList;

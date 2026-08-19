import { useEffect, useState } from "react";
import { Link } from "react-router";
import Badge from "../components/Badge";
import FilterDropdown from "../components/FilterDropdown";
import { listProjects, listTechTags, type Project } from "../lib/projectsApi";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_OPTIONS } from "../lib/projectTypes";
import { DEV_PROCESS_PHASE_OPTIONS } from "../lib/devProcessPhases";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type Status = "loading" | "loaded" | "error";

function formatPeriod(project: Project): string {
  const start = project.start_date;
  if (project.is_ongoing) return `${start} 〜 進行中`;
  return project.end_date ? `${start} 〜 ${project.end_date}` : start;
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
      </div>

      {status === "error" && (
        <p className="toast-error" role="alert">
          プロジェクト一覧の取得に失敗しました
        </p>
      )}

      {status === "loading" && <p role="status">読み込み中...</p>}

      {status === "loaded" && total === 0 && <p>プロジェクトが見つかりません</p>}

      {status === "loaded" && total > 0 && (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
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
        </>
      )}
    </main>
  );
}

export default ProjectList;

import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header";
import { listProjects, listTechTags, type Project } from "../lib/projectsApi";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_OPTIONS } from "../lib/projectTypes";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type Status = "loading" | "loaded" | "error";

function formatPeriod(project: Project): string {
  const start = project.start_date;
  if (project.is_ongoing) return `${start} 〜 進行中`;
  return project.end_date ? `${start} 〜 ${project.end_date}` : start;
}

function selectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

export function ProjectList() {
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [technology, setTechnology] = useState<string[]>([]);
  const [projectType, setProjectType] = useState<string[]>([]);
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
  }, [page, debouncedQ, technology, projectType]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Header />
      <main className="app-page">
        <div className="project-list-toolbar">
          <input
            type="search"
            role="searchbox"
            aria-label="検索"
            placeholder="検索..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="input-field"
          />
          <select
            multiple
            aria-label="技術でフィルタ"
            value={technology}
            onChange={(event) => setTechnology(selectedValues(event.target))}
          >
            {techOptions.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
          <select
            multiple
            aria-label="種別でフィルタ"
            value={projectType}
            onChange={(event) => setProjectType(selectedValues(event.target))}
          >
            {PROJECT_TYPE_OPTIONS.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <Link to="/projects/new" className="button-primary">
            + 新規プロジェクト
          </Link>
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
                      {project.project_types.map((t) => PROJECT_TYPE_LABELS[t] ?? t).join(", ")}
                    </td>
                    <td>{project.technologies.join(", ")}</td>
                    <td>{project.team_size ?? "—"}</td>
                    <td>{project.total_man_month ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </>
  );
}

export default ProjectList;

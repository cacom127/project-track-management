import { Link } from "react-router";
import Badge from "./Badge";
import { DEV_PROCESS_PHASE_LABELS } from "../lib/devProcessPhases";
import { formatPeriod } from "../lib/formatPeriod";
import type { Project } from "../lib/projectsApi";
import { PROJECT_TYPE_LABELS } from "../lib/projectTypes";

const MAX_VISIBLE_TECHNOLOGIES = 4;

type ProjectCardProps = {
  project: Project;
  selected: boolean;
  /** true nếu đã đạt giới hạn 10 (UI-PROJ-01-21) VÀ card này chưa được
   * chọn — checkbox của card đã chọn luôn bật để có thể bỏ chọn. */
  selectionDisabled: boolean;
  onToggleSelect: (id: number) => void;
};

/** UI-PROJ-01-17/18 (CHANGE-015) — hiển thị thay thế cho table row ở
 * List màn `card` mode. Toàn bộ card là 1 link tới Detail — không có
 * icon hành động riêng (Sửa/Xoá chỉ có ở Detail, giữ nguyên từ
 * CHANGE-010). Checkbox chọn export (UI-PROJ-01-19, CHANGE-017) chặn
 * `click` lan lên `<Link>` để không bị điều hướng khi tick chọn. */
export function ProjectCard({
  project,
  selected,
  selectionDisabled,
  onToggleSelect,
}: ProjectCardProps) {
  const visibleTechnologies = project.technologies.slice(0, MAX_VISIBLE_TECHNOLOGIES);
  const hiddenTechnologyCount = project.technologies.length - visibleTechnologies.length;

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <div className="project-card-header">
        <div className="project-card-avatar" aria-hidden="true">
          {project.customer_name.charAt(0)}
        </div>
        <div className="project-card-customer">
          <span className="project-card-customer-name">{project.customer_name}</span>
          <span className="project-card-industry">{project.industry || "—"}</span>
        </div>
        <span
          className={
            project.is_ongoing
              ? "project-card-status project-card-status-ongoing"
              : "project-card-status project-card-status-ended"
          }
        >
          {project.is_ongoing ? "進行中" : "終了"}
        </span>
      </div>

      {project.dev_process_phases.length > 0 && (
        <div className="project-card-dev-process">
          {project.dev_process_phases.map((code) => (
            <Badge key={code} variant="phase">
              {DEV_PROCESS_PHASE_LABELS[code] ?? code}
            </Badge>
          ))}
        </div>
      )}

      <p className="project-card-name">{project.project_name}</p>

      <div className="project-card-divider" />

      <div className="project-card-stats">
        <div>
          <span className="project-card-stats-label">人数</span>
          <span className="project-card-stats-value">{project.team_size ?? "—"}名</span>
        </div>
        <div>
          <span className="project-card-stats-label">総人月</span>
          <span className="project-card-stats-value">{project.total_man_month ?? "—"}人月</span>
        </div>
      </div>

      <p className="project-card-period">{formatPeriod(project)}</p>

      <div className="project-card-badges">
        {visibleTechnologies.map((tech) => (
          <Badge key={tech} variant="tech">
            {tech}
          </Badge>
        ))}
        {hiddenTechnologyCount > 0 && (
          <span className="project-card-more-badge">+{hiddenTechnologyCount}</span>
        )}
      </div>

      <div className="project-card-divider" />

      <div className="project-card-badges project-card-badges-dot">
        {project.project_types.map((t) => (
          <span key={t} className="project-card-dot-badge">
            ● {PROJECT_TYPE_LABELS[t] ?? t}
          </span>
        ))}
      </div>

      {/* UI-PROJ-01-19 (CHANGE-017) — feedback thực tế: đặt ở góc
          dưới-phải card (trước đó ở header, cạnh avatar). */}
      <input
        type="checkbox"
        className="project-card-select select-checkbox"
        checked={selected}
        disabled={selectionDisabled && !selected}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggleSelect(project.id)}
        aria-label={`${project.project_name}を選択`}
      />
    </Link>
  );
}

export default ProjectCard;

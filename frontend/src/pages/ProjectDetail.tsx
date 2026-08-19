import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AttachmentManager from "../components/AttachmentManager";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import { deleteProject, getProject, ProjectNotFoundError, type Project } from "../lib/projectsApi";
import { PROJECT_TYPE_LABELS } from "../lib/projectTypes";

type Status = "loading" | "loaded" | "not-found" | "error";

function formatPeriod(project: Project): string {
  const start = project.start_date;
  if (project.is_ongoing) return `${start} 〜 進行中`;
  return project.end_date ? `${start} 〜 ${project.end_date}` : start;
}

/** UI-PROJ-03-1..5: màn Detail — xem specs/projects-ui.md (sau khi fold). */
export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getProject(Number(id))
      .then((data) => {
        if (cancelled) return;
        setProject(data);
        setStatus("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus(err instanceof ProjectNotFoundError ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleConfirmDelete() {
    if (!project) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(project.id);
      navigate("/projects", {
        state: { successMessage: `「${project.project_name}」を削除しました` },
      });
    } catch {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDeleteError("プロジェクトの削除に失敗しました");
    }
  }

  if (status === "loading") {
    return (
      <main className="app-page">
        <p role="status">読み込み中...</p>
      </main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="app-page">
        <p>プロジェクトが見つかりません</p>
        <Link to="/projects">プロジェクト一覧へ戻る</Link>
      </main>
    );
  }

  if (status === "error" || !project) {
    return (
      <main className="app-page">
        <p className="toast-error" role="alert">
          プロジェクトの取得に失敗しました
        </p>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="form-container">
        <h1>{project.project_name}</h1>
        {deleteError && (
          <p className="toast-error" role="alert">
            {deleteError}
          </p>
        )}

        <section className="form-group-card">
          <h2 className="form-group-card-title">基本情報</h2>
          <p>顧客名: {project.customer_name}</p>
          <p>プロジェクト名: {project.project_name}</p>
          <p>概要: {project.description || "—"}</p>
        </section>

        <section className="form-group-card">
          <h2 className="form-group-card-title">期間・規模</h2>
          <p>期間: {formatPeriod(project)}</p>
          <p>
            人数: {project.team_size ?? "—"}名 / 総人月: {project.total_man_month ?? "—"}人月
          </p>
        </section>

        <section className="form-group-card">
          <h2 className="form-group-card-title">分類</h2>
          <p>
            技術:{" "}
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="tech">
                {tech}
              </Badge>
            ))}
          </p>
          <p>
            種別:{" "}
            {project.project_types.map((t) => (
              <Badge key={t} variant="type">
                {PROJECT_TYPE_LABELS[t] ?? t}
              </Badge>
            ))}
          </p>
        </section>

        <section className="form-group-card">
          <h2 className="form-group-card-title">画像添付（最大10枚）</h2>
          <AttachmentManager mode="live" projectId={project.id} />
        </section>

        <p>確認元メモ: {project.source_note || "—"}</p>

        <div className="form-actions">
          <Link to={`/projects/${project.id}/edit`} className="button-primary">
            編集
          </Link>
          <button
            type="button"
            className="button-destructive"
            onClick={() => setDeleteModalOpen(true)}
          >
            削除
          </button>
        </div>
      </div>

      <Modal
        open={deleteModalOpen}
        title={`「${project.project_name}」を削除しますか？`}
        onClose={() => setDeleteModalOpen(false)}
        confirmLabel="削除する"
        onConfirm={handleConfirmDelete}
        confirmDisabled={deleting}
      >
        <p>この操作は取り消せません。</p>
      </Modal>
    </main>
  );
}

export default ProjectDetail;

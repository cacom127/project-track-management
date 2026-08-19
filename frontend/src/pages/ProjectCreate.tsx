import { useNavigate } from "react-router";
import ProjectForm from "../components/ProjectForm";
import { createProject, type Project, type ProjectCreateInput } from "../lib/projectsApi";

const SERVER_ERROR_MESSAGE = "プロジェクトの作成に失敗しました";

export function ProjectCreate() {
  const navigate = useNavigate();

  // UI-PROJ-02-11: chỉ tạo project, KHÔNG điều hướng ở đây nữa — ProjectForm
  // cần project.id trả về để upload ảnh staged trước khi gọi onSuccess.
  async function handleSubmit(input: ProjectCreateInput): Promise<Project> {
    return createProject(input);
  }

  // UI-PROJ-02-4 (SỬA): điều hướng + toast thành công, gọi SAU khi ảnh
  // staged (nếu có) đã upload xong.
  function handleSuccess(project: Project) {
    navigate("/projects", {
      state: { successMessage: `「${project.project_name}」を作成しました` },
    });
  }

  return (
    <main className="app-page">
      <h1>新規プロジェクト</h1>
      <ProjectForm
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel="作成する"
        serverErrorMessage={SERVER_ERROR_MESSAGE}
        cancelTo="/projects"
      />
    </main>
  );
}

export default ProjectCreate;

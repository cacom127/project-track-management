import { useNavigate } from "react-router";
import ProjectForm from "../components/ProjectForm";
import { createProject, type ProjectCreateInput } from "../lib/projectsApi";

const SERVER_ERROR_MESSAGE = "プロジェクトの作成に失敗しました";

export function ProjectCreate() {
  const navigate = useNavigate();

  async function handleSubmit(input: ProjectCreateInput) {
    const created = await createProject(input);
    // UI-PROJ-02-4 (SỬA): kèm toast thành công sau khi điều hướng.
    navigate("/projects", {
      state: { successMessage: `「${created.project_name}」を作成しました` },
    });
  }

  return (
    <main className="app-page">
      <h1>新規プロジェクト</h1>
      <ProjectForm
        onSubmit={handleSubmit}
        submitLabel="作成する"
        serverErrorMessage={SERVER_ERROR_MESSAGE}
        cancelTo="/projects"
      />
    </main>
  );
}

export default ProjectCreate;

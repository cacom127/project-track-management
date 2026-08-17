import { apiFetch } from "./apiClient";

export type ProjectTypeCode = "offshore" | "ses" | "lab" | "new_dev" | "maintenance";

export type Project = {
  id: number;
  customer_name: string;
  project_name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_ongoing: boolean;
  team_size: number | null;
  total_man_month: number | null;
  source_note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  technologies: string[];
  project_types: ProjectTypeCode[];
};

export type ProjectListResponse = {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
};

export type ProjectCreateInput = {
  customer_name: string;
  project_name: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  is_ongoing?: boolean;
  team_size?: number | null;
  total_man_month?: number | null;
  source_note?: string | null;
  technologies?: string[];
  project_types?: ProjectTypeCode[];
};

export type ListProjectsParams = {
  page?: number;
  page_size?: number;
  q?: string;
  technology?: string[];
  project_type?: string[];
};

/** UI-PROJ-01-1..3: List, search, filter — xem specs/projects-ui.md. */
export async function listProjects(params: ListProjectsParams = {}): Promise<ProjectListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));
  if (params.q) searchParams.set("q", params.q);
  for (const tech of params.technology ?? []) searchParams.append("technology", tech);
  for (const type of params.project_type ?? []) searchParams.append("project_type", type);

  const response = await apiFetch(`/projects?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("プロジェクト一覧の取得に失敗しました");
  }
  return response.json();
}

/** PROJ-05: tạo dự án mới. */
export async function createProject(input: ProjectCreateInput): Promise<Project> {
  const response = await apiFetch("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("プロジェクトの作成に失敗しました");
  }
  return response.json();
}

/** UI-PROJ-02-3: autocomplete tag công nghệ. */
export async function listTechTags(q?: string): Promise<string[]> {
  const query = q ? `?${new URLSearchParams({ q }).toString()}` : "";
  const response = await apiFetch(`/tech-tags${query}`);
  if (!response.ok) {
    throw new Error("技術タグの取得に失敗しました");
  }
  return response.json();
}

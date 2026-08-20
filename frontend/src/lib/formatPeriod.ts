import type { Project } from "./projectsApi";

/** Dùng chung giữa table row (List) và ProjectCard (CHANGE-015) —
 * trước đó là hàm private trong ProjectList.tsx. */
export function formatPeriod(project: Project): string {
  const start = project.start_date;
  if (project.is_ongoing) return `${start} 〜 進行中`;
  return project.end_date ? `${start} 〜 ${project.end_date}` : start;
}

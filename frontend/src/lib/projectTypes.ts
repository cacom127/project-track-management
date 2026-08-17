import type { ProjectTypeCode } from "./projectsApi";

// DM-PROJ-04: catalog cố định — khớp đúng backend (`PROJECT_TYPE_CODES`
// ở `backend/app/projects/schemas.py`), KHÔNG cho thêm giá trị mới ở FE.
export const PROJECT_TYPE_OPTIONS: { code: ProjectTypeCode; label: string }[] = [
  { code: "offshore", label: "オフショア" },
  { code: "ses", label: "SES" },
  { code: "lab", label: "ラボ" },
  { code: "new_dev", label: "新規開発" },
  { code: "maintenance", label: "保守" },
];

export const PROJECT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_TYPE_OPTIONS.map(({ code, label }) => [code, label]),
);

import type { DevProcessPhaseCode } from "./projectsApi";

// DM-PROJ-08: catalog cố định — khớp đúng backend
// (`DEV_PROCESS_PHASE_CODES` ở `backend/app/projects/schemas.py`), KHÔNG
// cho thêm giá trị mới ở FE.
export const DEV_PROCESS_PHASE_OPTIONS: { code: DevProcessPhaseCode; label: string }[] = [
  { code: "requirements", label: "要件定義" },
  { code: "design", label: "設計" },
  { code: "implementation", label: "実装" },
  { code: "testing", label: "テスト" },
  { code: "release", label: "リリース" },
  { code: "maintenance_ops", label: "保守運用" },
];

export const DEV_PROCESS_PHASE_LABELS: Record<string, string> = Object.fromEntries(
  DEV_PROCESS_PHASE_OPTIONS.map(({ code, label }) => [code, label]),
);

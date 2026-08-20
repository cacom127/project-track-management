"""CHANGE-017 — nhãn tiếng Nhật cho các catalog code cố định
(`project_types`/`dev_process_phases`), dùng để hiển thị trên slide
export. Đây là bản sao của `frontend/src/lib/projectTypes.ts` và
`frontend/src/lib/devProcessPhases.ts` — catalog cố định, hiếm khi đổi
(DM-PROJ-04/DM-PROJ-08), nhưng nếu FE đổi nhãn thì phải đổi cả ở đây."""

PROJECT_TYPE_LABELS: dict[str, str] = {
    "offshore": "オフショア",
    "ses": "SES",
    "lab": "ラボ",
    "new_dev": "新規開発",
    "maintenance": "保守",
}

DEV_PROCESS_PHASE_LABELS: dict[str, str] = {
    "requirements": "要件定義",
    "design": "設計",
    "implementation": "実装",
    "testing": "テスト",
    "release": "リリース",
    "maintenance_ops": "保守運用",
}

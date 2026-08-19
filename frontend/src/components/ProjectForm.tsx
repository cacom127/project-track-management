import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import AttachmentManager from "./AttachmentManager";
import { uploadAttachment } from "../lib/attachmentsApi";
import {
  listTechTags,
  type DevProcessPhaseCode,
  type Project,
  type ProjectCreateInput,
  type ProjectTypeCode,
} from "../lib/projectsApi";
import { PROJECT_TYPE_OPTIONS } from "../lib/projectTypes";
import { DEV_PROCESS_PHASE_OPTIONS } from "../lib/devProcessPhases";

export type ProjectFormValues = {
  customer_name: string;
  project_name: string;
  description: string;
  start_date: string;
  is_ongoing: boolean;
  end_date: string;
  team_size: string;
  total_man_month: string;
  source_note: string;
  technologies: string[];
  project_types: ProjectTypeCode[];
  industry: string;
  outcome_note: string;
  dev_process_phases: DevProcessPhaseCode[];
  team_composition_note: string;
};

const EMPTY_VALUES: ProjectFormValues = {
  customer_name: "",
  project_name: "",
  description: "",
  start_date: "",
  is_ongoing: false,
  end_date: "",
  team_size: "",
  total_man_month: "",
  source_note: "",
  technologies: [],
  project_types: [],
  industry: "",
  outcome_note: "",
  dev_process_phases: [],
  team_composition_note: "",
};

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  // UI-PROJ-02-11: Edit truyền projectId (ảnh đính kèm mode "live",
  // upload/xoá ngay lập tức); Create không truyền (mode "staged", ảnh
  // chỉ upload sau khi project được tạo thành công — xem handleSubmit).
  projectId?: number;
  onSubmit: (input: ProjectCreateInput) => Promise<Project>;
  onSuccess: (project: Project) => void;
  submitLabel: string;
  serverErrorMessage: string;
  cancelTo: string;
}

/** Form dùng chung Create/Edit — tách từ ProjectCreate.tsx gốc
 * (CHANGE-010, UI-PROJ-04-3: Edit tái dùng đúng validation của Create). */
export function ProjectForm({
  initialValues,
  projectId,
  onSubmit,
  onSuccess,
  submitLabel,
  serverErrorMessage,
  cancelTo,
}: ProjectFormProps) {
  const values = { ...EMPTY_VALUES, ...initialValues };

  const [customerName, setCustomerName] = useState(values.customer_name);
  const [projectName, setProjectName] = useState(values.project_name);
  const [description, setDescription] = useState(values.description);
  const [startDate, setStartDate] = useState(values.start_date);
  const [isOngoing, setIsOngoing] = useState(values.is_ongoing);
  const [endDate, setEndDate] = useState(values.end_date);
  const [teamSize, setTeamSize] = useState(values.team_size);
  const [totalManMonth, setTotalManMonth] = useState(values.total_man_month);
  const [sourceNote, setSourceNote] = useState(values.source_note);
  const [technologies, setTechnologies] = useState<string[]>(values.technologies);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeCode[]>(values.project_types);
  const [industry, setIndustry] = useState(values.industry);
  const [outcomeNote, setOutcomeNote] = useState(values.outcome_note);
  const [devProcessPhases, setDevProcessPhases] = useState<DevProcessPhaseCode[]>(
    values.dev_process_phases,
  );
  const [teamCompositionNote, setTeamCompositionNote] = useState(values.team_composition_note);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // UI-PROJ-02-2: chặn submit trước khi gọi API nếu thiếu field bắt
  // buộc hoặc 進行中 + 終了日 mâu thuẫn nhau (khớp PROJ-06/07 backend).
  const missingRequired = !customerName.trim() || !projectName.trim() || !startDate;
  const ongoingConflict = isOngoing && endDate !== "";
  const canSubmit = !missingRequired && !ongoingConflict;

  // UI-PROJ-02-1
  function handleIsOngoingChange(checked: boolean) {
    setIsOngoing(checked);
    if (checked) setEndDate("");
  }

  // UI-PROJ-02-3
  function handleTagInputChange(value: string) {
    setTagInput(value);
    if (!value.trim()) {
      setTagSuggestions([]);
      return;
    }
    listTechTags(value)
      .then(setTagSuggestions)
      .catch(() => setTagSuggestions([]));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || technologies.includes(trimmed)) return;
    setTechnologies((prev) => [...prev, trimmed]);
    setTagInput("");
    setTagSuggestions([]);
  }

  function removeTag(tag: string) {
    setTechnologies((prev) => prev.filter((t) => t !== tag));
  }

  function toggleProjectType(code: ProjectTypeCode) {
    setProjectTypes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function toggleDevProcessPhase(code: DevProcessPhaseCode) {
    setDevProcessPhases((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const project = await onSubmit({
        customer_name: customerName,
        project_name: projectName,
        description: description || null,
        start_date: startDate,
        end_date: isOngoing ? null : endDate || null,
        is_ongoing: isOngoing,
        team_size: teamSize ? Number(teamSize) : null,
        total_man_month: totalManMonth ? Number(totalManMonth) : null,
        source_note: sourceNote || null,
        technologies,
        project_types: projectTypes,
        industry: industry || null,
        outcome_note: outcomeNote || null,
        dev_process_phases: devProcessPhases,
        team_composition_note: teamCompositionNote || null,
      });

      // UI-PROJ-05-4: project vừa tạo xong mới upload ảnh staged (chưa
      // có project_id lúc chọn/paste ảnh ở màn Create). Project đã tạo
      // thành công tính từ đây — best-effort từng ảnh, không rollback
      // hay chặn điều hướng nếu 1 ảnh lỗi (tránh mất project vừa tạo).
      if (!projectId && stagedFiles.length > 0) {
        setUploadingAttachments(true);
        for (const file of stagedFiles) {
          try {
            await uploadAttachment(project.id, file);
          } catch {
            // best-effort — bỏ qua lỗi từng ảnh, tiếp tục ảnh tiếp theo.
          }
        }
        setUploadingAttachments(false);
      }

      onSuccess(project);
    } catch (err) {
      void err;
      setServerError(serverErrorMessage);
      setSubmitting(false);
      setUploadingAttachments(false);
    }
  }

  return (
    <div className="form-container">
      {serverError && (
        <p className="toast-error" role="alert">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        {/* UI-PROJ-02-6: nhóm 1 — 基本情報 */}
        <section className="form-group-card">
          <h2 className="form-group-card-title">基本情報</h2>

          <div
            className={`input-field${touched && !customerName.trim() ? " input-field-error" : ""}`}
          >
            <label htmlFor="customer-name">
              顧客名 <span className="required-mark">*</span>
            </label>
            <input
              id="customer-name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              disabled={submitting}
            />
            {touched && !customerName.trim() && (
              <p className="field-error-message" role="alert">
                顧客名は必須です
              </p>
            )}
          </div>

          <div
            className={`input-field${touched && !projectName.trim() ? " input-field-error" : ""}`}
          >
            <label htmlFor="project-name">
              プロジェクト名 <span className="required-mark">*</span>
            </label>
            <input
              id="project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              disabled={submitting}
            />
            {touched && !projectName.trim() && (
              <p className="field-error-message" role="alert">
                プロジェクト名は必須です
              </p>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="description">概要</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="input-field">
            <label htmlFor="industry">業種</label>
            <input
              id="industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              disabled={submitting}
            />
          </div>
        </section>

        {/* UI-PROJ-02-6: nhóm 2 — 期間・規模 */}
        <section className="form-group-card">
          <h2 className="form-group-card-title">期間・規模</h2>

          <div className={`input-field${touched && !startDate ? " input-field-error" : ""}`}>
            <label htmlFor="start-date">
              開始日 <span className="required-mark">*</span>
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={submitting}
            />
            {touched && !startDate && (
              <p className="field-error-message" role="alert">
                開始日は必須です
              </p>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="is-ongoing">
              <input
                id="is-ongoing"
                type="checkbox"
                checked={isOngoing}
                onChange={(event) => handleIsOngoingChange(event.target.checked)}
                disabled={submitting}
              />
              進行中
            </label>
          </div>

          <div className={`input-field${touched && ongoingConflict ? " input-field-error" : ""}`}>
            <label htmlFor="end-date">終了日</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={submitting || isOngoing}
            />
            {touched && ongoingConflict && (
              <p className="field-error-message" role="alert">
                進行中の場合、終了日は入力できません
              </p>
            )}
          </div>

          {/* UI-PROJ-02-7: đơn vị cố định cạnh input, không phải
              placeholder; 2 field nằm ngang hàng (feedback CHANGE-009) */}
          <div className="form-row">
            <div className="input-field">
              <label htmlFor="team-size">人数</label>
              <div className="input-field-with-unit">
                <input
                  id="team-size"
                  type="number"
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                  disabled={submitting}
                />
                <span className="input-unit">名</span>
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="total-man-month">総人月</label>
              <div className="input-field-with-unit">
                <input
                  id="total-man-month"
                  type="number"
                  value={totalManMonth}
                  onChange={(event) => setTotalManMonth(event.target.value)}
                  disabled={submitting}
                />
                <span className="input-unit">人月</span>
              </div>
            </div>
          </div>

          <div className="input-field">
            <label htmlFor="team-composition-note">チーム体制の詳細</label>
            <textarea
              id="team-composition-note"
              value={teamCompositionNote}
              onChange={(event) => setTeamCompositionNote(event.target.value)}
              disabled={submitting}
            />
          </div>
        </section>

        {/* UI-PROJ-02-6: nhóm 3 — 分類 */}
        <section className="form-group-card">
          <h2 className="form-group-card-title">分類</h2>

          <div className="input-field">
            <label htmlFor="tech-input">技術</label>
            {/* Wrapper để dropdown gợi ý bám sát ngay dưới input, không bị
                hint text chen giữa (feedback CHANGE-010). */}
            <div className="tech-input-wrapper">
              <input
                id="tech-input"
                placeholder="入力してEnterで追加（複数可）"
                aria-describedby="tech-input-hint"
                value={tagInput}
                onChange={(event) => handleTagInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag(tagInput);
                  }
                }}
                disabled={submitting}
              />
              {tagSuggestions.length > 0 && (
                <ul className="tag-suggestions">
                  {tagSuggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button type="button" onClick={() => addTag(suggestion)}>
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p id="tech-input-hint" className="input-hint">
              技術名を入力してEnterキーで追加できます。複数追加可能です。
            </p>
            <ul className="tag-chip-list">
              {technologies.map((tag) => (
                <li key={tag}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`${tag}を削除`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <fieldset disabled={submitting}>
            <legend>種別</legend>
            {PROJECT_TYPE_OPTIONS.map(({ code, label }) => (
              <label key={code}>
                <input
                  type="checkbox"
                  checked={projectTypes.includes(code)}
                  onChange={() => toggleProjectType(code)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset disabled={submitting}>
            <legend>開発工程</legend>
            {DEV_PROCESS_PHASE_OPTIONS.map(({ code, label }) => (
              <label key={code}>
                <input
                  type="checkbox"
                  checked={devProcessPhases.includes(code)}
                  onChange={() => toggleDevProcessPhase(code)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </section>

        {/* UI-PROJ-05-1..6: mode "live" khi đã có projectId (Edit) — upload/xoá
            ngay lập tức; mode "staged" khi Create (chưa có project_id). */}
        <section className="form-group-card">
          <h2 className="form-group-card-title">画像添付（最大10枚）</h2>
          {projectId ? (
            <AttachmentManager mode="live" projectId={projectId} />
          ) : (
            <AttachmentManager
              mode="staged"
              stagedFiles={stagedFiles}
              onStagedFilesChange={setStagedFiles}
            />
          )}
        </section>

        <div className="input-field">
          <label htmlFor="outcome-note">成果・課題・解決策</label>
          <textarea
            id="outcome-note"
            value={outcomeNote}
            onChange={(event) => setOutcomeNote(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="input-field">
          <label htmlFor="source-note">確認元メモ</label>
          <textarea
            id="source-note"
            value={sourceNote}
            onChange={(event) => setSourceNote(event.target.value)}
            disabled={submitting}
          />
        </div>

        {/* UI-PROJ-02-8: nút Huỷ cạnh nút submit, không submit */}
        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={submitting}>
            {uploadingAttachments ? "画像をアップロード中..." : submitLabel}
          </button>
          <Link to={cancelTo} className="button-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { createProject, listTechTags, type ProjectTypeCode } from "../lib/projectsApi";
import { PROJECT_TYPE_OPTIONS } from "../lib/projectTypes";

const SERVER_ERROR_MESSAGE = "プロジェクトの作成に失敗しました";

export function ProjectCreate() {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [totalManMonth, setTotalManMonth] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeCode[]>([]);

  const [submitting, setSubmitting] = useState(false);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await createProject({
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
      });
      navigate("/projects");
    } catch (err) {
      void err;
      setServerError(SERVER_ERROR_MESSAGE);
      setSubmitting(false);
    }
  }

  return (
    <main className="app-page">
      <div className="form-container">
        <h1>新規プロジェクト</h1>
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

            {/* UI-PROJ-02-7: đơn vị cố định cạnh input, không phải placeholder */}
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
          </section>

          {/* UI-PROJ-02-6: nhóm 3 — 分類 */}
          <section className="form-group-card">
            <h2 className="form-group-card-title">分類</h2>

            <div className="input-field">
              <label htmlFor="tech-input">技術</label>
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
              <p id="tech-input-hint" className="input-hint">
                技術名を入力してEnterキーで追加できます。複数追加可能です。
              </p>
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
              <ul className="tag-chip-list">
                {technologies.map((tag) => (
                  <li key={tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`${tag}を削除`}
                    >
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
          </section>

          <div className="input-field">
            <label htmlFor="source-note">確認元メモ</label>
            <textarea
              id="source-note"
              value={sourceNote}
              onChange={(event) => setSourceNote(event.target.value)}
              disabled={submitting}
            />
          </div>

          {/* UI-PROJ-02-8: nút Huỷ cạnh nút tạo, không submit */}
          <div className="form-actions">
            <button type="submit" className="button-primary" disabled={submitting}>
              作成する
            </button>
            <Link to="/projects" className="button-secondary">
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default ProjectCreate;

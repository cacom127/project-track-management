import { useState, type FormEvent } from "react";
import type { CognitoUser } from "amazon-cognito-identity-js";
import { completeNewPassword } from "../lib/auth";

type Props = {
  cognitoUser: CognitoUser;
  onSuccess: () => void;
};

const POLICY_ERROR_MESSAGE =
  "パスワードの条件を満たしていません（8文字以上、大文字・小文字・数字を含む）";
const MISMATCH_ERROR_MESSAGE = "パスワードが一致しません";

// Khớp password_policy thật của UserPool (CHANGE-005, AUTH-14): min 8,
// hoa/thường/số — KHÔNG bắt ký tự đặc biệt.
function meetsPasswordPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function ChangePassword({ cognitoUser, onSuccess }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Chặn submit trước khi gọi Cognito khi 2 field không khớp hoặc chưa
  // đạt policy (state matrix, delta-spec mục 1c).
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = meetsPasswordPolicy(newPassword) && newPassword === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await completeNewPassword(cognitoUser, newPassword);
      onSuccess();
    } catch (err) {
      // UI-AUTH-02-2: policy đã pre-check ở client, nhưng Cognito vẫn
      // là nguồn xác nhận cuối — dùng cùng message cho mọi lỗi từ
      // bước này (chưa có case nào khác được định nghĩa ở delta-spec).
      void err;
      setServerError(POLICY_ERROR_MESSAGE);
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>新しいパスワードを設定してください</h1>
        {serverError && (
          <p className="toast-error" role="alert">
            {serverError}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <label htmlFor="new-password">新しいパスワード</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className={`input-field${mismatch ? " input-field-error" : ""}`}>
            <label htmlFor="confirm-password">確認用パスワード</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={submitting}
              required
            />
            {mismatch && (
              <p className="field-error-message" role="alert">
                {MISMATCH_ERROR_MESSAGE}
              </p>
            )}
          </div>

          <button type="submit" className="button-primary" disabled={submitting || !canSubmit}>
            設定する
          </button>
        </form>
      </div>
    </main>
  );
}

export default ChangePassword;

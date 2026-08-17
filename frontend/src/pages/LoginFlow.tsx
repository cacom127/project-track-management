import { useState } from "react";
import type { CognitoUser } from "amazon-cognito-identity-js";
import { useNavigate } from "react-router";
import ChangePassword from "./ChangePassword";
import Login from "./Login";

/**
 * Nối màn Login + Đổi mật khẩu lần đầu thành 1 flow (UI-AUTH-01/02) —
 * đổi mật khẩu KHÔNG phải route riêng, chỉ là state hiển thị thay Login
 * sau challenge NEW_PASSWORD_REQUIRED.
 */
export function LoginFlow() {
  const [challenge, setChallenge] = useState<CognitoUser | null>(null);
  const navigate = useNavigate();

  function goHome() {
    navigate("/", { replace: true });
  }

  if (challenge) {
    return <ChangePassword cognitoUser={challenge} onSuccess={goHome} />;
  }

  return <Login onLoginSuccess={goHome} onNewPasswordRequired={setChallenge} />;
}

export default LoginFlow;

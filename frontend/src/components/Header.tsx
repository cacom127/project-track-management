import { useNavigate } from "react-router";
import { getCurrentUser, logout } from "../lib/auth";

/** UI-AUTH-03-2/03-3: email + role ở header, đăng xuất về /login. */
export function Header() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-header">
      {user && (
        <>
          <span className="user-email">{user.email}</span>
          <span className="user-role">{user.role}</span>
        </>
      )}
      <button type="button" className="button-primary" onClick={handleLogout}>
        ログアウト
      </button>
    </header>
  );
}

export default Header;

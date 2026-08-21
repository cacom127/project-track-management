import { NavLink } from "react-router";

/** UI-SHELL-01/02: sidebar cố định 240px, item active theo route hiện tại.
 * ARCH-SHELL-02 (CHANGE-018): header logo VPM phía trên nav.
 * ARCH-SHELL-03 (CHANGE-018): icon inline cạnh trái label của mỗi item. */
export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="VPM" className="sidebar-logo" />
      </div>
      <NavLink
        to="/projects"
        className={({ isActive }) =>
          isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"
        }
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="sidebar-item-icon">
          <rect
            x="1.5"
            y="2.5"
            width="13"
            height="11"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <line x1="4" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.3" />
          <line x1="4" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        プロジェクト一覧
      </NavLink>
    </nav>
  );
}

export default Sidebar;

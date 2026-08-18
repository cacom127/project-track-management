import { NavLink } from "react-router";

/** UI-SHELL-01/02: sidebar cố định 240px, item active theo route hiện tại. */
export function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink
        to="/projects"
        className={({ isActive }) =>
          isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"
        }
      >
        プロジェクト一覧
      </NavLink>
    </nav>
  );
}

export default Sidebar;

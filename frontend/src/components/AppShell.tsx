import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

/** UI-SHELL-01..03: Header (đầy đủ chiều rộng, đã có từ CHANGE-005) +
 * Sidebar 240px cố định + nội dung trang — dùng chung mọi route đã
 * đăng nhập, thay vì mỗi trang tự render Header riêng lẻ. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="app-body">
        <Sidebar />
        {children}
      </div>
    </>
  );
}

export default AppShell;

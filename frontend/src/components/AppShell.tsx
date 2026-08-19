import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ToastHost from "./ToastHost";

/** UI-SHELL-01..03: Sidebar 240px kéo dài hết chiều cao trang (fixed,
 * đè lên cả Header phía trên — feedback CHANGE-009), Header + nội dung
 * nằm trong phần còn lại bên phải. Dùng chung mọi route đã đăng nhập,
 * thay vì mỗi trang tự render Header riêng lẻ. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <ToastHost />
        {children}
      </div>
    </div>
  );
}

export default AppShell;

/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // amazon-cognito-identity-js (CHANGE-005) là thư viện viết cho
  // Node.js, bên trong dùng biến toàn cục `global` — trình duyệt không
  // có biến này, khiến bundle crash ngay khi load ("global is not
  // defined") -> trang trắng. Vite không tự polyfill như Webpack, phải
  // tự thay `global` bằng `globalThis` (chuẩn ES2020, trình duyệt hỗ
  // trợ sẵn) lúc build.
  define: {
    global: "globalThis",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
  },
});

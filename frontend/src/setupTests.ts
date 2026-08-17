import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest không bật `globals: true` (xem vite.config.ts) nên
// @testing-library/react không tự nhận diện được framework để auto
// cleanup — phải tự gọi, nếu không DOM từ test trước còn sót lại khiến
// các test dùng nhiều render() (như Login.test.tsx) bị lỗi "multiple
// elements found".
afterEach(() => {
  cleanup();
});

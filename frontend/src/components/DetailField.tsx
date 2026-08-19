import type { ReactNode } from "react";

type DetailFieldProps = {
  label: string;
  children: ReactNode;
};

/** UI-PROJ-03-11 (CHANGE-014) — mỗi field trong 1 block Detail (基本情報/
 * 期間・規模/分類/その他) hiển thị label nhỏ/mờ phía trên, giá trị rõ
 * phía dưới, có đường kẻ mảnh ngăn cách giữa các field (feedback: khó
 * nhận biết ranh giới từng field, đặc biệt khi giá trị dài nhiều dòng). */
export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <div className="detail-field">
      <span className="detail-field-label">{label}</span>
      <div className="detail-field-value">{children}</div>
    </div>
  );
}

export default DetailField;

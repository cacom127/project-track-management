type MultilineTextProps = {
  value: string | null | undefined;
};

/** UI-PROJ-03-8 (CHANGE-014, SỬA sau feedback thực tế) — giữ nguyên
 * xuống dòng của giá trị lưu trong DB khi hiển thị read-only, KHÔNG
 * chuyển thành bullet list (đã thử — trông sai với field dạng đoạn
 * văn tự do như 概要). Dùng CSS `white-space: pre-wrap` qua class
 * `.multiline-text` — xuống dòng giữ nguyên, không có dấu •. */
export function MultilineText({ value }: MultilineTextProps) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return <>—</>;

  return <span className="multiline-text">{trimmed}</span>;
}

export default MultilineText;

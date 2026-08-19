type MultilineTextProps = {
  value: string | null | undefined;
};

/** UI-PROJ-03-8 (CHANGE-014) — giữ nguyên xuống dòng của giá trị lưu
 * trong DB khi hiển thị read-only: ≥2 dòng render dạng bullet list, 1
 * dòng (hoặc rỗng) render text thường — tránh 1 bullet đơn độc vô nghĩa. */
export function MultilineText({ value }: MultilineTextProps) {
  const lines = (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return <>—</>;
  if (lines.length === 1) return <>{lines[0]}</>;

  return (
    <ul className="multiline-list">
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );
}

export default MultilineText;

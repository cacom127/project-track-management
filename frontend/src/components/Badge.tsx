import type { ReactNode } from "react";

type BadgeVariant = "type" | "tech" | "phase";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  type: "badge-type",
  tech: "badge-tech",
  phase: "badge-phase",
};

/** UI-PROJ-01-9 / UI-PROJ-03-10: badge riêng cho từng giá trị 種別
 * (type)/技術 (tech)/開発工程 (phase — CHANGE-014, trước đó dùng chung
 * màu "type"). */
export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge ${VARIANT_CLASS[variant]}`}>{children}</span>;
}

export default Badge;

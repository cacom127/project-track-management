import type { ReactNode } from "react";

type BadgeVariant = "type" | "tech";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

/** UI-PROJ-01-9: badge riêng cho từng giá trị 種別 (type)/技術 (tech). */
export function Badge({ variant, children }: BadgeProps) {
  const variantClass = variant === "type" ? "badge-type" : "badge-tech";

  return <span className={`badge ${variantClass}`}>{children}</span>;
}

export default Badge;

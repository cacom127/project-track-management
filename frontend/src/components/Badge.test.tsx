import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Badge from "./Badge";

describe("Badge", () => {
  it("renders 種別 badge with badge-type class (UI-PROJ-01-9)", () => {
    render(<Badge variant="type">オフショア</Badge>);

    const badge = screen.getByText("オフショア");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("badge");
    expect(badge).toHaveClass("badge-type");
  });

  it("renders 技術 badge with badge-tech class (UI-PROJ-01-9)", () => {
    render(<Badge variant="tech">React</Badge>);

    const badge = screen.getByText("React");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("badge");
    expect(badge).toHaveClass("badge-tech");
  });
});

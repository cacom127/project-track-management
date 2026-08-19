import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MultilineText from "./MultilineText";

describe("MultilineText", () => {
  it("renders '—' when value is null/undefined/empty", () => {
    const { rerender } = render(<MultilineText value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();

    rerender(<MultilineText value={undefined} />);
    expect(screen.getByText("—")).toBeInTheDocument();

    rerender(<MultilineText value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders plain text (no bullet) when value has exactly 1 line", () => {
    render(<MultilineText value="1行だけの値" />);
    expect(screen.getByText("1行だけの値")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders a bullet list when value has 2+ non-empty lines", () => {
    render(<MultilineText value={"課題：A\n解決策：B\n成果：C"} />);
    const list = screen.getByRole("list");
    expect(list.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText("課題：A")).toBeInTheDocument();
    expect(screen.getByText("成果：C")).toBeInTheDocument();
  });

  it("trims lines and drops empty lines", () => {
    render(<MultilineText value={"  A  \n\n  B  \n"} />);
    const list = screen.getByRole("list");
    expect(list.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

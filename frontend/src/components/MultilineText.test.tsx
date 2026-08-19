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

  it("renders plain text, no bullet list, for a single-line value", () => {
    render(<MultilineText value="1行だけの値" />);
    expect(screen.getByText("1行だけの値")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("preserves line breaks without turning them into a bullet list (SỬA sau feedback)", () => {
    render(<MultilineText value={"課題：A\n解決策：B\n成果：C"} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByText("課題：A", { exact: false })).toBeInTheDocument();
  });

  it("trims leading/trailing whitespace of the whole value", () => {
    const { container } = render(<MultilineText value={"  A\nB  \n"} />);
    expect(container.querySelector(".multiline-text")?.textContent).toBe("A\nB");
  });
});

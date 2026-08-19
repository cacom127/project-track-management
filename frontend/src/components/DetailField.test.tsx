import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DetailField from "./DetailField";

describe("DetailField", () => {
  it("renders the label and value as separate elements (UI-PROJ-03-11)", () => {
    render(<DetailField label="業種">製造業</DetailField>);

    expect(screen.getByText("業種")).toHaveClass("detail-field-label");
    expect(screen.getByText("製造業")).toHaveClass("detail-field-value");
  });

  it("supports non-text children (e.g. badges)", () => {
    render(
      <DetailField label="技術">
        <span data-testid="fake-badge">React</span>
      </DetailField>,
    );

    expect(screen.getByTestId("fake-badge")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterDropdown from "./FilterDropdown";

const OPTIONS = [
  { value: "React", label: "React" },
  { value: "AWS", label: "AWS" },
];

describe("FilterDropdown", () => {
  it("renders the button with just the label when nothing is selected (UI-PROJ-01-8)", () => {
    render(<FilterDropdown label="技術" options={OPTIONS} value={[]} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "技術" })).toBeInTheDocument();
  });

  it("shows the selected count in the button label (UI-PROJ-01-8)", () => {
    const { rerender } = render(
      <FilterDropdown label="技術" options={OPTIONS} value={[]} onChange={() => {}} />,
    );

    rerender(
      <FilterDropdown label="技術" options={OPTIONS} value={["React"]} onChange={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "技術 (1)" })).toBeInTheDocument();
  });

  it("opens the checkbox panel when the button is clicked (UI-PROJ-01-8)", () => {
    render(<FilterDropdown label="技術" options={OPTIONS} value={[]} onChange={() => {}} />);

    expect(screen.queryByRole("checkbox", { name: "React" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "技術" }));

    expect(screen.getByRole("checkbox", { name: "React" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "AWS" })).toBeInTheDocument();
  });

  it("calls onChange with the added value when a checkbox is checked (UI-PROJ-01-8)", () => {
    const onChange = vi.fn();
    render(<FilterDropdown label="技術" options={OPTIONS} value={["React"]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "技術 (1)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "AWS" }));

    expect(onChange).toHaveBeenCalledWith(["React", "AWS"]);
  });

  it("calls onChange without the value when an already-checked checkbox is unchecked (UI-PROJ-01-8)", () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        label="技術"
        options={OPTIONS}
        value={["React", "AWS"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "技術 (2)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "React" }));

    expect(onChange).toHaveBeenCalledWith(["AWS"]);
  });

  it("does not close the panel after toggling a checkbox (UI-PROJ-01-8)", () => {
    render(<FilterDropdown label="技術" options={OPTIONS} value={[]} onChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "技術" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "React" }));

    expect(screen.getByRole("checkbox", { name: "AWS" })).toBeInTheDocument();
  });

  it("does not show a search box when there are few options (UI-PROJ-01-12)", () => {
    render(<FilterDropdown label="技術" options={OPTIONS} value={[]} onChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "技術" }));

    expect(screen.queryByLabelText("技術を検索")).not.toBeInTheDocument();
  });

  it("shows a search box that filters options when there are many (UI-PROJ-01-12)", () => {
    const manyOptions = Array.from({ length: 10 }, (_, i) => ({
      value: `Tech${i}`,
      label: `Tech${i}`,
    }));
    render(<FilterDropdown label="技術" options={manyOptions} value={[]} onChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "技術" }));
    expect(screen.getByRole("checkbox", { name: "Tech5" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("技術を検索"), { target: { value: "Tech1" } });

    expect(screen.getByRole("checkbox", { name: "Tech1" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Tech5" })).not.toBeInTheDocument();
  });

  it("closes the panel when clicking outside the component (UI-PROJ-01-8)", () => {
    render(
      <div>
        <FilterDropdown label="技術" options={OPTIONS} value={[]} onChange={() => {}} />
        <button type="button">外側のボタン</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "技術" }));
    expect(screen.getByRole("checkbox", { name: "React" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "外側のボタン" }));

    expect(screen.queryByRole("checkbox", { name: "React" })).not.toBeInTheDocument();
  });
});

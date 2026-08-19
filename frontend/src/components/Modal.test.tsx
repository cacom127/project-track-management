import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders nothing when open is false (UI-PROJ-03-4)", () => {
    render(
      <Modal
        open={false}
        title="タイトル"
        confirmLabel="削除する"
        onClose={() => {}}
        onConfirm={() => {}}
      >
        本文
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title, body, and buttons when open (UI-PROJ-03-4)", () => {
    render(
      <Modal
        open
        title="「サンプル案件」を削除しますか？"
        confirmLabel="削除する"
        onClose={() => {}}
        onConfirm={() => {}}
      >
        この操作は取り消せません。
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("「サンプル案件」を削除しますか？")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "削除する" })).toBeInTheDocument();
  });

  it("renders a backdrop and panel with the expected classNames (UI-PROJ-03-4)", () => {
    const { container } = render(
      <Modal open title="タイトル" confirmLabel="削除する" onClose={() => {}} onConfirm={() => {}}>
        本文
      </Modal>,
    );

    expect(container.querySelector(".modal-backdrop")).toBeInTheDocument();
    expect(container.querySelector(".modal-panel")).toBeInTheDocument();
  });

  it("calls onClose when the Cancel button is clicked (UI-PROJ-03-4)", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="タイトル" confirmLabel="削除する" onClose={onClose} onConfirm={() => {}}>
        本文
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked (UI-PROJ-03-4)", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open title="タイトル" confirmLabel="削除する" onClose={onClose} onConfirm={() => {}}>
        本文
      </Modal>,
    );

    fireEvent.click(container.querySelector(".modal-backdrop") as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the panel (UI-PROJ-03-4)", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="タイトル" confirmLabel="削除する" onClose={onClose} onConfirm={() => {}}>
        本文
      </Modal>,
    );

    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onConfirm when the Confirm button is clicked (UI-PROJ-03-5)", () => {
    const onConfirm = vi.fn();
    render(
      <Modal open title="タイトル" confirmLabel="削除する" onClose={() => {}} onConfirm={onConfirm}>
        本文
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses the button-secondary and button-destructive classNames (UI-PROJ-03-4)", () => {
    render(
      <Modal open title="タイトル" confirmLabel="削除する" onClose={() => {}} onConfirm={() => {}}>
        本文
      </Modal>,
    );

    expect(screen.getByRole("button", { name: "キャンセル" })).toHaveClass("button-secondary");
    expect(screen.getByRole("button", { name: "削除する" })).toHaveClass("button-destructive");
  });

  it("disables the Confirm button when confirmDisabled is true (Deleting state)", () => {
    render(
      <Modal
        open
        title="タイトル"
        confirmLabel="削除する"
        confirmDisabled
        onClose={() => {}}
        onConfirm={() => {}}
      >
        本文
      </Modal>,
    );

    expect(screen.getByRole("button", { name: "削除する" })).toBeDisabled();
  });
});

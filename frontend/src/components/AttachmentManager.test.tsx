import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listAttachmentsMock = vi.fn();
const uploadAttachmentMock = vi.fn();
const deleteAttachmentMock = vi.fn();

// KHÔNG dùng importOriginal: "../lib/attachmentsApi" -> "./apiClient" ->
// "./auth" khởi tạo CognitoUserPool ngay lúc import, lỗi ở CI (không có
// env Cognito). Factory tự-chứa, không gọi module thật.
vi.mock("../lib/attachmentsApi", () => ({
  ALLOWED_ATTACHMENT_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_ATTACHMENTS: 10,
  MAX_ATTACHMENT_SIZE_BYTES: 5 * 1024 * 1024,
  listAttachments: (...args: unknown[]) => listAttachmentsMock(...args),
  uploadAttachment: (...args: unknown[]) => uploadAttachmentMock(...args),
  deleteAttachment: (...args: unknown[]) => deleteAttachmentMock(...args),
}));

import { AttachmentManager } from "./AttachmentManager";

function makeFile(name: string, type: string, sizeBytes = 100) {
  const file = new File([new Uint8Array(sizeBytes)], name, { type });
  return file;
}

function makeAttachment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    project_id: 1,
    file_name: "a.png",
    content_type: "image/png",
    size_bytes: 100,
    created_at: "2024-01-01T00:00:00Z",
    url: "https://s3.example.com/a.png",
    ...overrides,
  };
}

// jsdom không implement createObjectURL/revokeObjectURL.
beforeEach(() => {
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:preview-url"),
      revokeObjectURL: vi.fn(),
    }),
  );
  listAttachmentsMock.mockReset();
  uploadAttachmentMock.mockReset();
  deleteAttachmentMock.mockReset();
  listAttachmentsMock.mockResolvedValue([]);
});

function getFileInput() {
  return screen.getByLabelText("画像ファイルを選択") as HTMLInputElement;
}

describe("AttachmentManager — staged mode", () => {
  it("adding a file via file picker appends it via onStagedFilesChange without calling the API", () => {
    const onStagedFilesChange = vi.fn();
    const file = makeFile("a.png", "image/png");
    render(
      <AttachmentManager
        mode="staged"
        stagedFiles={[]}
        onStagedFilesChange={onStagedFilesChange}
      />,
    );

    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(onStagedFilesChange).toHaveBeenCalledWith([file]);
    expect(uploadAttachmentMock).not.toHaveBeenCalled();
    expect(listAttachmentsMock).not.toHaveBeenCalled();
  });

  it("renders a thumbnail preview per staged file", () => {
    const file = makeFile("a.png", "image/png");
    render(<AttachmentManager mode="staged" stagedFiles={[file]} onStagedFilesChange={vi.fn()} />);

    const images = document.querySelectorAll(".thumbnail-image");
    expect(images.length).toBe(1);
  });

  it("removing a staged file splices it out via onStagedFilesChange", () => {
    const file1 = makeFile("a.png", "image/png");
    const file2 = makeFile("b.png", "image/png");
    const onStagedFilesChange = vi.fn();
    render(
      <AttachmentManager
        mode="staged"
        stagedFiles={[file1, file2]}
        onStagedFilesChange={onStagedFilesChange}
      />,
    );

    const removeButtons = screen.getAllByRole("button", { name: "削除" });
    fireEvent.click(removeButtons[0]);

    expect(onStagedFilesChange).toHaveBeenCalledWith([file2]);
  });

  it("rejects a file with an invalid type without adding it", () => {
    const onStagedFilesChange = vi.fn();
    const file = makeFile("a.txt", "text/plain");
    render(
      <AttachmentManager
        mode="staged"
        stagedFiles={[]}
        onStagedFilesChange={onStagedFilesChange}
      />,
    );

    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(onStagedFilesChange).not.toHaveBeenCalled();
    expect(screen.getByText(/対応していないファイル形式です/)).toBeInTheDocument();
  });

  it("rejects an oversized file without adding it", () => {
    const onStagedFilesChange = vi.fn();
    const file = makeFile("a.png", "image/png", 6 * 1024 * 1024);
    render(
      <AttachmentManager
        mode="staged"
        stagedFiles={[]}
        onStagedFilesChange={onStagedFilesChange}
      />,
    );

    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(onStagedFilesChange).not.toHaveBeenCalled();
    expect(screen.getByText(/ファイルサイズが大きすぎます/)).toBeInTheDocument();
  });

  it("disables the add button and paste zone at the 10-image limit", () => {
    const stagedFiles = Array.from({ length: 10 }, (_, i) => makeFile(`${i}.png`, "image/png"));
    render(
      <AttachmentManager mode="staged" stagedFiles={stagedFiles} onStagedFilesChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "+ 画像を選択" })).toBeDisabled();
    const pasteZone = screen.getByText("上限（10枚）に達しました");
    expect(pasteZone).not.toHaveAttribute("tabIndex");
  });

  it("opens a lightbox showing the full-size image when a thumbnail is clicked, and closes on backdrop click", () => {
    const file = makeFile("a.png", "image/png");
    render(<AttachmentManager mode="staged" stagedFiles={[file]} onStagedFilesChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(document.querySelector(".thumbnail-image")!);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector(".lightbox-image")).toHaveAttribute("src", "blob:preview-url");

    fireEvent.click(document.querySelector(".modal-backdrop")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the lightbox via the close button", () => {
    const file = makeFile("a.png", "image/png");
    render(<AttachmentManager mode="staged" stagedFiles={[file]} onStagedFilesChange={vi.fn()} />);

    fireEvent.click(document.querySelector(".thumbnail-image")!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AttachmentManager — live mode", () => {
  it("calls listAttachments on mount and renders returned thumbnails", async () => {
    listAttachmentsMock.mockResolvedValue([makeAttachment({ id: 1 }), makeAttachment({ id: 2 })]);
    render(<AttachmentManager mode="live" projectId={1} />);

    await waitFor(() => expect(listAttachmentsMock).toHaveBeenCalledWith(1));
    await waitFor(() => expect(document.querySelectorAll(".thumbnail-image").length).toBe(2));
  });

  it("adding a file calls uploadAttachment and renders the new thumbnail", async () => {
    uploadAttachmentMock.mockResolvedValue(makeAttachment({ id: 9 }));
    render(<AttachmentManager mode="live" projectId={1} />);
    await waitFor(() => expect(listAttachmentsMock).toHaveBeenCalled());

    const file = makeFile("a.png", "image/png");
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(uploadAttachmentMock).toHaveBeenCalledWith(1, file);
    await waitFor(() => expect(document.querySelectorAll(".thumbnail-image").length).toBe(1));
  });

  it("removing an attachment calls deleteAttachment", async () => {
    listAttachmentsMock.mockResolvedValue([makeAttachment({ id: 1 })]);
    deleteAttachmentMock.mockResolvedValue(undefined);
    render(<AttachmentManager mode="live" projectId={1} />);

    await screen.findByRole("button", { name: "削除" });
    fireEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(deleteAttachmentMock).toHaveBeenCalledWith(1, 1);
    await waitFor(() => expect(document.querySelectorAll(".thumbnail-image").length).toBe(0));
  });

  it("rejects an invalid file without calling uploadAttachment", async () => {
    render(<AttachmentManager mode="live" projectId={1} />);
    await waitFor(() => expect(listAttachmentsMock).toHaveBeenCalled());

    const file = makeFile("a.txt", "text/plain");
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(uploadAttachmentMock).not.toHaveBeenCalled();
    expect(screen.getByText(/対応していないファイル形式です/)).toBeInTheDocument();
  });

  it("disables the add button and paste zone at the 10-image limit", async () => {
    listAttachmentsMock.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => makeAttachment({ id: i + 1 })),
    );
    render(<AttachmentManager mode="live" projectId={1} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "+ 画像を選択" })).toBeDisabled(),
    );
    const pasteZone = screen.getByText("上限（10枚）に達しました");
    expect(pasteZone).not.toHaveAttribute("tabIndex");
  });

  it("opens a lightbox showing the full-size image for a live attachment", async () => {
    listAttachmentsMock.mockResolvedValue([
      makeAttachment({ id: 1, url: "https://s3.example.com/full.png" }),
    ]);
    render(<AttachmentManager mode="live" projectId={1} />);

    await waitFor(() => expect(document.querySelectorAll(".thumbnail-image").length).toBe(1));
    fireEvent.click(document.querySelector(".thumbnail-image")!);

    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".lightbox-image")).toHaveAttribute(
      "src",
      "https://s3.example.com/full.png",
    );
  });
});

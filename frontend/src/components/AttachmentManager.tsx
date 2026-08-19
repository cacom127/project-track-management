import { useEffect, useRef, useState } from "react";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE_BYTES,
  deleteAttachment,
  listAttachments,
  uploadAttachment,
  type Attachment,
} from "../lib/attachmentsApi";

type StagedProps = {
  mode: "staged";
  stagedFiles: File[];
  onStagedFilesChange: (files: File[]) => void;
};

type LiveProps = {
  mode: "live";
  projectId: number;
};

export type AttachmentManagerProps = StagedProps | LiveProps;

type PendingUpload = {
  tempKey: string;
  previewUrl: string;
};

type ThumbnailItem = {
  key: string;
  url: string;
  loading: boolean;
  onRemove?: () => void;
};

let pendingKeySeq = 0;

/** UI-PROJ-05-1..6: xem changes/CHANGE-011-project-attachments/ui-delta-spec.md. */
export function AttachmentManager(props: AttachmentManagerProps) {
  const { mode } = props;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [stagedPreviews, setStagedPreviews] = useState<Map<File, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pasteZoneFocused, setPasteZoneFocused] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stagedPreviewsRef = useRef(stagedPreviews);
  stagedPreviewsRef.current = stagedPreviews;

  // live mode: tải danh sách ảnh hiện có khi mount (UI-PROJ-05-3).
  useEffect(() => {
    if (mode !== "live") {
      return;
    }
    let cancelled = false;
    listAttachments(props.projectId)
      .then((list) => {
        if (!cancelled) {
          setAttachments(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("画像の取得に失敗しました");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // staged mode: tạo/thu hồi object URL preview theo `stagedFiles`, tránh
  // leak (URL.createObjectURL giữ tham chiếu blob cho tới khi revoke).
  useEffect(() => {
    if (mode !== "staged") {
      return;
    }
    setStagedPreviews((prev) => {
      const next = new Map<File, string>();
      for (const file of props.stagedFiles) {
        next.set(file, prev.get(file) ?? URL.createObjectURL(file));
      }
      for (const [file, url] of prev) {
        if (!next.has(file)) {
          URL.revokeObjectURL(url);
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mode === "staged" ? props.stagedFiles : null]);

  // Thu hồi toàn bộ object URL khi component unmount.
  useEffect(() => {
    return () => {
      stagedPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const stagedCount = mode === "staged" ? props.stagedFiles.length : 0;
  const liveCount = mode === "live" ? attachments.length + pendingUploads.length : 0;
  const totalCount = mode === "staged" ? stagedCount : liveCount;
  const atLimit = totalCount >= MAX_ATTACHMENTS;

  function addFiles(files: File[]) {
    setError(null);
    let total = totalCount;
    const validFiles: File[] = [];

    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        setError(`対応していないファイル形式です: ${file.name}`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setError(`ファイルサイズが大きすぎます（5MBまで）: ${file.name}`);
        continue;
      }
      if (total >= MAX_ATTACHMENTS) {
        setError("上限（10枚）に達しました");
        continue;
      }
      validFiles.push(file);
      total += 1;
    }

    if (validFiles.length === 0) {
      return;
    }

    if (mode === "staged") {
      props.onStagedFilesChange([...props.stagedFiles, ...validFiles]);
      return;
    }

    validFiles.forEach((file) => uploadOneLive(props.projectId, file));
  }

  function uploadOneLive(projectId: number, file: File) {
    const tempKey = `pending-${pendingKeySeq++}`;
    const previewUrl = URL.createObjectURL(file);
    setPendingUploads((prev) => [...prev, { tempKey, previewUrl }]);

    uploadAttachment(projectId, file)
      .then((attachment) => {
        setAttachments((prev) => [...prev, attachment]);
      })
      .catch(() => {
        setError("画像のアップロードに失敗しました");
      })
      .finally(() => {
        URL.revokeObjectURL(previewUrl);
        setPendingUploads((prev) => prev.filter((p) => p.tempKey !== tempKey));
      });
  }

  function handleRemoveStaged(index: number) {
    if (mode !== "staged") {
      return;
    }
    const next = [...props.stagedFiles];
    next.splice(index, 1);
    props.onStagedFilesChange(next);
  }

  function handleDeleteLive(attachmentId: number) {
    if (mode !== "live") {
      return;
    }
    const { projectId } = props;
    setDeletingIds((prev) => new Set(prev).add(attachmentId));
    deleteAttachment(projectId, attachmentId)
      .then(() => {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      })
      .catch(() => {
        setError("画像の削除に失敗しました");
      })
      .finally(() => {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(attachmentId);
          return next;
        });
      });
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) {
      addFiles(files);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (atLimit) {
      return;
    }
    const items = Array.from(event.clipboardData.items);
    const files = items
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (files.length > 0) {
      event.preventDefault();
      addFiles(files);
    }
  }

  const items: ThumbnailItem[] =
    mode === "staged"
      ? props.stagedFiles.map((file, index) => ({
          key: `staged-${index}`,
          url: stagedPreviews.get(file) ?? "",
          loading: false,
          onRemove: () => handleRemoveStaged(index),
        }))
      : [
          ...attachments.map((attachment) => ({
            key: `attachment-${attachment.id}`,
            url: attachment.url,
            loading: deletingIds.has(attachment.id),
            onRemove: () => handleDeleteLive(attachment.id),
          })),
          ...pendingUploads.map((pending) => ({
            key: pending.tempKey,
            url: pending.previewUrl,
            loading: true,
            onRemove: undefined,
          })),
        ];

  const pasteZoneClassName = [
    "paste-zone",
    atLimit ? "paste-zone-disabled" : pasteZoneFocused ? "paste-zone-focused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="attachment-manager">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-label="画像ファイルを選択"
        hidden
        disabled={atLimit}
        onChange={handleFileInputChange}
      />
      <button
        type="button"
        className="button-secondary"
        disabled={atLimit}
        onClick={() => fileInputRef.current?.click()}
      >
        + 画像を選択
      </button>

      <div
        className={pasteZoneClassName}
        tabIndex={atLimit ? undefined : 0}
        onFocus={() => setPasteZoneFocused(true)}
        onBlur={() => setPasteZoneFocused(false)}
        onPaste={handlePaste}
      >
        {atLimit ? "上限（10枚）に達しました" : "クリックしてCtrl+Vで画像を貼り付け"}
      </div>

      {error && <p className="attachment-error">{error}</p>}

      <div className="thumbnail-grid">
        {items.map((item) => (
          <div key={item.key} className="thumbnail">
            <img
              src={item.url}
              alt=""
              className="thumbnail-image"
              onClick={() => setLightboxUrl(item.url)}
            />
            {item.loading && <div className="thumbnail-loading-overlay" aria-label="読み込み中" />}
            {item.onRemove && (
              <button
                type="button"
                className="thumbnail-remove"
                aria-label="削除"
                disabled={item.loading}
                onClick={(event) => {
                  event.stopPropagation();
                  item.onRemove?.();
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxUrl && (
        // Lightbox bespoke (không tái dùng `Modal.tsx`): `Modal` gắn cứng
        // 1 nút Confirm (contract {confirmLabel, onConfirm}) không phù
        // hợp với 1 dialog xem-ảnh thuần tuý, chỉ cần đóng. Dùng lại
        // class CSS `.modal-backdrop`/`.modal-panel`-style (xem
        // `.lightbox-panel` trong index.css) để giữ visual nhất quán mà
        // không kéo theo action button không cần thiết.
        <div className="modal-backdrop" onClick={() => setLightboxUrl(null)}>
          <div
            className="lightbox-panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close"
              aria-label="閉じる"
              onClick={() => setLightboxUrl(null)}
            >
              ×
            </button>
            <img src={lightboxUrl} alt="" className="lightbox-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default AttachmentManager;

import { apiFetch } from "./apiClient";

export type Attachment = {
  id: number;
  project_id: number;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  url: string;
};

/** Client-side validation mirrors backend limits (delta-spec.md PROJ-18/19). */
export const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

export type AttachmentPresignInput = {
  file_name: string;
  content_type: string;
};

export type AttachmentPresignResponse = {
  upload_url: string;
  s3_key: string;
};

export type AttachmentConfirmInput = {
  s3_key: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
};

/** PROJ-18: xin presigned PUT URL trước khi upload ảnh lên S3. */
export async function presignAttachment(
  projectId: number,
  input: AttachmentPresignInput,
): Promise<AttachmentPresignResponse> {
  const response = await apiFetch(`/projects/${projectId}/attachments/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("アップロードURLの取得に失敗しました");
  }
  return response.json();
}

/**
 * Upload trực tiếp lên presigned S3 URL — KHÔNG dùng `apiFetch`: URL đã
 * có chữ ký riêng, gắn thêm `Authorization` sẽ làm sai signature.
 */
export async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("画像のアップロードに失敗しました");
  }
}

/** PROJ-19: xác nhận upload đã xong, tạo record `attachments`. */
export async function confirmAttachment(
  projectId: number,
  input: AttachmentConfirmInput,
): Promise<Attachment> {
  const response = await apiFetch(`/projects/${projectId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("画像の登録に失敗しました");
  }
  return response.json();
}

/** PROJ-20: danh sách ảnh đính kèm của 1 dự án. */
export async function listAttachments(projectId: number): Promise<Attachment[]> {
  const response = await apiFetch(`/projects/${projectId}/attachments`);
  if (!response.ok) {
    throw new Error("画像の取得に失敗しました");
  }
  return response.json();
}

/** PROJ-21: xoá 1 ảnh đính kèm (hard delete, cả S3 object và DB record). */
export async function deleteAttachment(projectId: number, attachmentId: number): Promise<void> {
  const response = await apiFetch(`/projects/${projectId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("画像の削除に失敗しました");
  }
}

/**
 * Tiện ích cho mode `live` của `AttachmentManager`: chain
 * presign -> PUT -> confirm cho 1 file.
 */
export async function uploadAttachment(projectId: number, file: File): Promise<Attachment> {
  const { upload_url, s3_key } = await presignAttachment(projectId, {
    file_name: file.name,
    content_type: file.type,
  });
  await uploadToPresignedUrl(upload_url, file);
  return confirmAttachment(projectId, {
    s3_key,
    file_name: file.name,
    content_type: file.type,
    size_bytes: file.size,
  });
}

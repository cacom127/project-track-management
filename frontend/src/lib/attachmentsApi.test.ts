import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetchMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("./apiClient", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.stubGlobal("fetch", fetchMock);

import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS,
  confirmAttachment,
  deleteAttachment,
  listAttachments,
  presignAttachment,
  uploadAttachment,
  uploadToPresignedUrl,
} from "./attachmentsApi";

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

const SAMPLE_ATTACHMENT = {
  id: 1,
  project_id: 1,
  file_name: "a.png",
  content_type: "image/png",
  size_bytes: 100,
  created_at: "2024-01-01T00:00:00Z",
  url: "https://s3.example.com/a.png?sig=xyz",
};

describe("constants", () => {
  it("exports client-side validation constants matching backend limits", () => {
    expect(ALLOWED_ATTACHMENT_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(MAX_ATTACHMENTS).toBe(10);
    expect(MAX_ATTACHMENT_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("presignAttachment", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("POSTs to /projects/{id}/attachments/presign and returns upload_url + s3_key", async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(200, { upload_url: "https://s3/put", s3_key: "projects/1/x.png" }),
    );

    const result = await presignAttachment(1, {
      file_name: "a.png",
      content_type: "image/png",
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/projects/1/attachments/presign",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const [, init] = apiFetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ file_name: "a.png", content_type: "image/png" });
    expect(result).toEqual({ upload_url: "https://s3/put", s3_key: "projects/1/x.png" });
  });

  it("throws when response is not ok", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400, {}));

    await expect(
      presignAttachment(1, { file_name: "a.png", content_type: "image/png" }),
    ).rejects.toThrow();
  });
});

describe("uploadToPresignedUrl", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    apiFetchMock.mockReset();
  });

  it("PUTs the file directly to the presigned URL without apiFetch/Authorization", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    const file = new File(["hello"], "a.png", { type: "image/png" });

    await uploadToPresignedUrl("https://s3/put?sig=xyz", file);

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("https://s3/put?sig=xyz", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: file,
    });
  });

  it("throws when the S3 PUT response is not ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    const file = new File(["hello"], "a.png", { type: "image/png" });

    await expect(uploadToPresignedUrl("https://s3/put", file)).rejects.toThrow();
  });
});

describe("confirmAttachment", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("POSTs to /projects/{id}/attachments and returns the created attachment", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, SAMPLE_ATTACHMENT));

    const result = await confirmAttachment(1, {
      s3_key: "projects/1/x.png",
      file_name: "a.png",
      content_type: "image/png",
      size_bytes: 100,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/projects/1/attachments",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual(SAMPLE_ATTACHMENT);
  });

  it("throws when response is not ok", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400, {}));

    await expect(
      confirmAttachment(1, {
        s3_key: "x",
        file_name: "a.png",
        content_type: "image/png",
        size_bytes: 100,
      }),
    ).rejects.toThrow();
  });
});

describe("listAttachments", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("GETs /projects/{id}/attachments and returns the list", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, [SAMPLE_ATTACHMENT]));

    const result = await listAttachments(1);

    expect(apiFetchMock).toHaveBeenCalledWith("/projects/1/attachments");
    expect(result).toEqual([SAMPLE_ATTACHMENT]);
  });

  it("throws when response is not ok", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500, {}));

    await expect(listAttachments(1)).rejects.toThrow();
  });
});

describe("deleteAttachment", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("DELETEs /projects/{id}/attachments/{attachmentId}", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(204, undefined));

    await deleteAttachment(1, 5);

    expect(apiFetchMock).toHaveBeenCalledWith("/projects/1/attachments/5", { method: "DELETE" });
  });

  it("throws when response is not ok", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404, {}));

    await expect(deleteAttachment(1, 5)).rejects.toThrow();
  });
});

describe("uploadAttachment", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    fetchMock.mockReset();
  });

  it("chains presign -> PUT -> confirm and returns the confirmed attachment", async () => {
    apiFetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { upload_url: "https://s3/put", s3_key: "projects/1/x.png" }),
      )
      .mockResolvedValueOnce(jsonResponse(201, SAMPLE_ATTACHMENT));
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    const file = new File(["hello"], "a.png", { type: "image/png" });

    const result = await uploadAttachment(1, file);

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      1,
      "/projects/1/attachments/presign",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://s3/put",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      "/projects/1/attachments",
      expect.objectContaining({ method: "POST" }),
    );
    const [, confirmInit] = apiFetchMock.mock.calls[1];
    expect(JSON.parse(confirmInit.body)).toEqual({
      s3_key: "projects/1/x.png",
      file_name: "a.png",
      content_type: "image/png",
      size_bytes: file.size,
    });
    expect(result).toEqual(SAMPLE_ATTACHMENT);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetchMock = vi.fn();

vi.mock("./apiClient", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

import { createProject, listProjects, listTechTags } from "./projectsApi";

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

describe("listProjects", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("calls GET /projects with default paging when no params given", async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(200, { items: [], total: 0, page: 1, page_size: 20 }),
    );

    await listProjects();

    expect(apiFetchMock).toHaveBeenCalledWith("/projects?");
  });

  it("builds query string from page/page_size/q/technology/project_type", async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(200, { items: [], total: 0, page: 2, page_size: 10 }),
    );

    await listProjects({
      page: 2,
      page_size: 10,
      q: "sony",
      technology: ["React", "AWS"],
      project_type: ["offshore"],
    });

    const [path] = apiFetchMock.mock.calls[0];
    const url = new URL(`http://x${path}`);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("page_size")).toBe("10");
    expect(url.searchParams.get("q")).toBe("sony");
    expect(url.searchParams.getAll("technology")).toEqual(["React", "AWS"]);
    expect(url.searchParams.getAll("project_type")).toEqual(["offshore"]);
  });

  it("returns the parsed JSON body", async () => {
    const body = { items: [{ id: 1 }], total: 1, page: 1, page_size: 20 };
    apiFetchMock.mockResolvedValue(jsonResponse(200, body));

    const result = await listProjects();

    expect(result).toEqual(body);
  });

  it("throws when response is not ok", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500, {}));

    await expect(listProjects()).rejects.toThrow();
  });
});

describe("createProject", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("POSTs JSON body to /projects and returns created project", async () => {
    const created = { id: 1, project_name: "P" };
    apiFetchMock.mockResolvedValue(jsonResponse(201, created));

    const result = await createProject({
      customer_name: "ABC",
      project_name: "P",
      start_date: "2024-01-01",
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/projects",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const [, init] = apiFetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      customer_name: "ABC",
      project_name: "P",
      start_date: "2024-01-01",
    });
    expect(result).toEqual(created);
  });

  it("throws with server error detail when response is not ok", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400, { detail: "bad request" }));

    await expect(
      createProject({ customer_name: "A", project_name: "B", start_date: "2024-01-01" }),
    ).rejects.toThrow();
  });
});

describe("listTechTags", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("calls GET /tech-tags without query when q is empty", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, []));

    await listTechTags();

    expect(apiFetchMock).toHaveBeenCalledWith("/tech-tags");
  });

  it("calls GET /tech-tags?q=... when q is given", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, ["React"]));

    await listTechTags("Rea");

    expect(apiFetchMock).toHaveBeenCalledWith("/tech-tags?q=Rea");
  });

  it("returns the parsed JSON array", async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, ["React", "AWS"]));

    const result = await listTechTags();

    expect(result).toEqual(["React", "AWS"]);
  });
});

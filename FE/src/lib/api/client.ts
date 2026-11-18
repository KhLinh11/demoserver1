import {
  DataPage,
  PnLSummary,
  RunInfo,
  WhatIfRequest,
} from "@/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function safeApiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const url = new URL(path, window.location.origin);
  return url.href;
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const url = safeApiUrl(path);
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(30000)])
      : AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    let message = `Lỗi yêu cầu máy chủ (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((e: { msg?: string }) => e.msg || "").join("; ");
      }
    } catch {
      // Body not JSON
    }
    throw new ApiError(res.status, message);
  }
  return res;
}

export async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await request(path, { method: "GET", signal });
  return res.json();
}

export async function send<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT",
  data: object | FormData,
  signal?: AbortSignal,
): Promise<T> {
  const isMultipart = data instanceof FormData;
  const res = await request(path, {
    method,
    body: isMultipart ? data : JSON.stringify(data),
    headers: isMultipart ? undefined : { "Content-Type": "application/json" },
    signal,
  });
  return res.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(safeApiUrl("/api/health"), { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createRun(
  file: File | Blob,
  filename: string,
  companyName: string = "Công ty Cổ phần Gia dụng Gia Hòa",
  painpoints: string = "Nghi vấn nhận vơ doanh thu và hoàn trễ sau 30 ngày.",
): Promise<RunInfo> {
  const fd = new FormData();
  fd.append("file", file, filename);
  fd.append("company_name", companyName);
  fd.append("painpoints", painpoints);
  return send<RunInfo>("/api/runs", "POST", fd);
}

export async function getRun(runId: string): Promise<RunInfo> {
  return get<RunInfo>(`/api/runs/${runId}`);
}

export async function getRunData(runId: string, page: number = 1, pageSize: number = 50): Promise<DataPage> {
  return get<DataPage>(`/api/runs/${runId}/data?page=${page}&page_size=${pageSize}`);
}

export async function approveCleansing(runId: string, approver: string = "Data Steward"): Promise<RunInfo> {
  return send<RunInfo>(`/api/runs/${runId}/approve`, "POST", { approver_name: approver });
}

export async function simulateWhatIf(runId: string, req: WhatIfRequest): Promise<PnLSummary> {
  return send<PnLSummary>(`/api/runs/${runId}/what-if`, "POST", req);
}

export async function getPnL(runId: string): Promise<PnLSummary> {
  return get<PnLSummary>(`/api/runs/${runId}/pnl`);
}

export async function downloadReportPdf(runId: string, filename: string = "Bao_Cao_Kiem_Toan.pdf") {
  const res = await request(`/api/runs/${runId}/export/pdf`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return blob.size;
}

export async function downloadReportCsv(runId: string, filename: string = "So_Cai_Kiem_Toan.csv") {
  const res = await request(`/api/runs/${runId}/export/csv`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return blob.size;
}

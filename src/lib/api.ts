// 백엔드 API (NestJS). 로그인 토큰과 "진료받을 사람"은 이 기기에만 저장
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api";

export type Profile = { id: number; name: string; age: number; isChild: boolean; isOwner: boolean };
export type Source = { document: string; edition: number; page: number; heading: string; excerpt: string };
export type ChatResult = { type: "answer" | "symptom" | "handoff"; category: string; answer: string; sources: Source[]; clinic: { open: boolean; phone: string; hours: string; message: string } };

const get = (k: string) => (typeof window === "undefined" ? null : window.localStorage.getItem(k));
export const session = {
  token: () => get("miso.token"),
  patientId: () => get("miso.pid"),
  set(token: string, pid?: number) {
    localStorage.setItem("miso.token", token);
    if (pid) localStorage.setItem("miso.pid", String(pid));
  },
  setPatient(pid: number) { localStorage.setItem("miso.pid", String(pid)); },
  clear() { localStorage.removeItem("miso.token"); localStorage.removeItem("miso.pid"); },
};

export class ApiError extends Error { constructor(public status: number, msg: string) { super(msg); } }

export async function api<T = unknown>(path: string, opt: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = session.token(); if (t) headers.Authorization = `Bearer ${t}`;
  const p = session.patientId(); if (p) headers["X-Patient-Id"] = p;
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { method: opt.method || (opt.body ? "POST" : "GET"), headers, body: opt.body ? JSON.stringify(opt.body) : undefined });
  } catch {
    throw new ApiError(0, "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") { session.clear(); window.location.href = "/"; }
    throw new ApiError(res.status, (Array.isArray(j.message) ? j.message[0] : j.message) || "문제가 생겼어요. 다시 시도해 주세요.");
  }
  return j as T;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 3600e3);
  const h = k.getUTCHours(), m = k.getUTCMinutes();
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${DOW[k.getUTCDay()]}) ${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}
export function fmtDate(ymd: string) {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
export function kstToday() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
}
export function addDays(ymd: string, n: number) {
  const t = new Date(ymd + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10);
}
export function dowOf(ymd: string) { return DOW[new Date(ymd + "T00:00:00Z").getUTCDay()]; }

"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useProfile, PageTitle } from "@/components/shell";
import { Badge, Empty, Spinner } from "@/components/ui";

type N = { id: number; kind: string; title: string; body: string; sent_at: string; read_at: string | null; patient_id: number; patient: string };
const LINK: Record<string, string> = { "전날 확인": "/appointments", "검진 안내": "/book?procedure=정기 검진", "데스크 답변": "/chat" };

// P7 알림함: 전날 확인 · 검진 안내 · 데스크 답변 (가족 알림 모두)
export default function NotificationsPage() {
  const router = useRouter();
  const { profiles, choose } = useProfile();
  const [list, setList] = useState<N[] | null>(null);
  useEffect(() => { api<N[]>("/notifications").then(setList).catch(() => setList([])); }, []);

  async function open(n: N) {
    if (!n.read_at) await api(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    if (profiles.length > 1) choose(n.patient_id); // 아이 알림이면 그 아이로 바꿔서 이동
    router.push(LINK[n.kind] || "/home");
  }

  return (
    <div>
      <PageTitle title="알림" sub="전날 확인 · 검진 안내 · 데스크 답변을 모아 보여 드려요" />
      <div className="px-4 pt-3">
        {!list ? <Spinner /> : list.length === 0 ? <Empty>새 알림이 없어요</Empty> : (
          <ul className="overflow-hidden rounded-2xl bg-white">
            {list.map((n) => (
              <li key={n.id} className="border-b border-grey-100 last:border-0">
                <button onClick={() => open(n)} className="w-full px-5 py-4 text-left">
                  <div className="flex items-center gap-2">
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-danger" />}
                    <Badge tone={n.kind === "전날 확인" ? "warning" : n.kind === "데스크 답변" ? "brand" : "success"}>{n.kind}</Badge>
                    {profiles.length > 1 && <span className="text-[13px] font-semibold text-grey-500">{n.patient}</span>}
                  </div>
                  <p className={`mt-2 text-[16px] ${n.read_at ? "text-grey-700" : "font-semibold"}`}>{n.title}</p>
                  <p className="mt-1 text-[14px] text-grey-500">{n.body}</p>
                  <p className="mt-2 text-[12px] text-grey-400">{new Date(n.sent_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

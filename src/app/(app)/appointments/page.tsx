"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, fmtDateTime } from "@/lib/api";
import { useProfile, PageTitle } from "@/components/shell";
import { Badge, Button, Card, Empty, ErrorText, Spinner } from "@/components/ui";

type Appt = { id: number; start_at: string; procedure: string; confirm_status: string; source: string; patient_id: number; patient: string };

// P4 내 예약 (가족 예약 모두) · P4-1 전날 확인 (갈게요 / 변경할게요)
export default function AppointmentsPage() {
  const { profiles } = useProfile();
  const [list, setList] = useState<Appt[] | null>(null);
  const [err, setErr] = useState("");
  const load = () => api<Appt[]>("/appointments").then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function answer(id: number, a: "yes" | "change") {
    setErr("");
    try { await api(`/appointments/${id}/confirm`, { body: { answer: a } }); load(); } catch (e) { setErr((e as Error).message); }
  }

  const family = profiles.length > 1;
  return (
    <div>
      <PageTitle title="예약" sub={family ? "가족 예약을 모두 보여 드려요" : undefined} />
      <div className="space-y-3 px-4 pt-3">
        <Link href="/book" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-[16px] font-semibold text-white"><Plus size={20} /> 새 예약 신청</Link>
        <ErrorText>{err}</ErrorText>
        {!list ? <Spinner /> : list.length === 0 ? <Empty>예정된 예약이 없어요</Empty> : list.map((a) => {
          const hours = (new Date(a.start_at).getTime() - Date.now()) / 3600e3;
          const soon = hours < 36;
          return (
            <Card key={a.id}>
              <div className="flex items-start justify-between">
                <div>
                  {family && <p className="mb-1 text-[13px] font-semibold text-brand">{a.patient}</p>}
                  <p className="text-[18px] font-bold">{fmtDateTime(a.start_at)}</p>
                  <p className="mt-1 text-[15px] text-grey-700">{a.procedure}</p>
                </div>
                {a.confirm_status === "확인" ? <Badge tone="success">방문 확인</Badge> : a.confirm_status === "변경 요청" ? <Badge tone="warning">변경 요청함</Badge> : <Badge>{soon ? "확인 필요" : "예약됨"}</Badge>}
              </div>
              {a.confirm_status === "미확인" && soon && (
                <div className="mt-4 rounded-m bg-grey-50 p-4">
                  <p className="text-[15px] font-semibold">예약 시간에 오실 수 있나요?</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button onClick={() => answer(a.id, "yes")}>갈게요</Button>
                    <Button variant="secondary" onClick={() => answer(a.id, "change")}>변경할게요</Button>
                  </div>
                </div>
              )}
              {a.confirm_status === "변경 요청" && <p className="mt-3 text-[14px] text-grey-500">데스크에서 전화로 시간을 다시 잡아 드릴게요.</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

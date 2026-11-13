"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, addDays, dowOf, kstToday } from "@/lib/api";
import { useProfile, PageTitle } from "@/components/shell";
import { Button, ErrorText, Spinner } from "@/components/ui";

type Proc = { id: number; name: string; duration_min: number };
type Slot = { time: string; available: boolean };

// P5 예약 신청 → P5-1 시술 선택 → 빈 시간 선택. 빈 의자가 없는 시간은 고를 수 없음
function Book() {
  const router = useRouter();
  const params = useSearchParams();
  const { current } = useProfile();
  const [procs, setProcs] = useState<Proc[]>([]);
  const [proc, setProc] = useState<Proc | null>(null);
  const today = kstToday();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter((d) => dowOf(d) !== "일"), [today]);
  const [date, setDate] = useState(days[0]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Proc[]>("/procedures").then((ps) => {
      setProcs(ps);
      const want = params.get("procedure");
      if (want) setProc(ps.find((p) => p.name === want) || null);
    });
  }, [params]);
  useEffect(() => {
    if (!proc) return;
    setSlots(null); setTime("");
    api<Slot[]>(`/slots?procedureId=${proc.id}&date=${date}`).then(setSlots).catch((e) => setErr(e.message));
  }, [proc, date]);

  async function submit() {
    if (!proc || !time) return;
    setBusy(true); setErr("");
    try {
      await api("/appointments", { body: { procedureId: proc.id, date, time } });
      router.replace("/appointments");
    } catch (e) {
      setErr((e as Error).message);
      api<Slot[]>(`/slots?procedureId=${proc.id}&date=${date}`).then(setSlots);
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageTitle title="예약 신청" sub={current ? `${current.name}${current.isChild ? " 어린이" : "님"}의 예약이에요` : undefined} />
      <div className="space-y-6 bg-white px-5 pb-6">
        <section>
          <h2 className="text-[15px] font-semibold text-grey-700">1. 어떤 진료인가요?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {procs.map((p) => (
              <button key={p.id} onClick={() => setProc(p)} className={`rounded-m border px-3 py-3 text-left ${proc?.id === p.id ? "border-brand bg-brand-weak" : "border-grey-200"}`}>
                <p className="text-[15px] font-semibold">{p.name}</p>
                <p className="text-[13px] text-grey-500">약 {p.duration_min}분</p>
              </button>
            ))}
          </div>
        </section>

        {proc && (
          <section>
            <h2 className="text-[15px] font-semibold text-grey-700">2. 날짜</h2>
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((d) => (
                <button key={d} onClick={() => setDate(d)} className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-m ${date === d ? "bg-grey-900 text-white" : "bg-grey-100"}`}>
                  <span className={`text-[12px] ${date === d ? "text-grey-400" : dowOf(d) === "토" ? "text-brand" : "text-grey-500"}`}>{dowOf(d)}</span>
                  <span className="text-[17px] font-bold">{Number(d.slice(8))}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {proc && (
          <section>
            <h2 className="text-[15px] font-semibold text-grey-700">3. 시간 <span className="font-normal text-grey-500">· 빈 의자가 있는 시간만 고를 수 있어요</span></h2>
            {!slots ? <Spinner /> : slots.length === 0 ? <p className="mt-3 text-[15px] text-grey-500">이 날은 예약할 수 있는 시간이 없어요.</p> : (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)}
                    className={`h-11 rounded-m text-[15px] font-medium ${time === s.time ? "bg-brand text-white" : s.available ? "bg-grey-100" : "bg-grey-50 text-grey-400 line-through"}`}>{s.time}</button>
                ))}
              </div>
            )}
          </section>
        )}
        <ErrorText>{err}</ErrorText>
      </div>
      <div className="sticky bottom-16 bg-white px-5 py-3">
        <Button className="w-full" disabled={!proc || !time || busy} onClick={submit}>
          {proc && time ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 ${time} ${proc.name} 예약` : "진료와 시간을 골라 주세요"}
        </Button>
      </div>
    </div>
  );
}

export default function BookPage() {
  return <Suspense fallback={<Spinner />}><Book /></Suspense>;
}

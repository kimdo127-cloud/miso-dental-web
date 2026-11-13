"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, addDays, dowOf, kstToday } from "@/lib/api";
import { useProfile } from "@/components/shell";
import { Button, ErrorText, Spinner } from "@/components/ui";

type Proc = { id: number; name: string; duration_min: number };
type Slot = { time: string; available: boolean };

// P5 예약 신청 → P5-1 시술 선택 → 빈 시간 선택. 빈 의자가 없는 시간은 고를 수 없음
function Book() {
  const router = useRouter();
  const params = useSearchParams();
  const { current, profiles, choose } = useProfile();
  const [procs, setProcs] = useState<Proc[]>([]);
  const [proc, setProc] = useState<Proc | null>(null);
  const today = kstToday();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter((d) => dowOf(d) !== "일"), [today]);
  const [date, setDate] = useState(days[0]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [overdue, setOverdue] = useState(false);
  useEffect(() => { api<{ checkupOverdue: boolean }>("/me").then((m) => setOverdue(m.checkupOverdue)).catch(() => {}); }, [current?.id]);

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

  const am = slots?.filter((s) => Number(s.time.slice(0, 2)) < 12) || [];
  const pm = slots?.filter((s) => Number(s.time.slice(0, 2)) >= 12) || [];
  const openCount = slots?.filter((s) => s.available).length || 0;
  const step = !proc ? 1 : !time ? 2 : 3;
  const md = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일 (${dowOf(d)})`;

  const SlotGrid = ({ list }: { list: Slot[] }) => (
    <div className="mt-2 grid grid-cols-4 gap-2">
      {list.map((s) => (
        <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)}
          className={`flex h-12 flex-col items-center justify-center rounded-xl text-[15px] font-semibold transition ${time === s.time ? "bg-brand text-white shadow-[0_4px_12px_rgba(49,130,246,.3)]" : s.available ? "border border-grey-200 bg-white text-grey-900 active:bg-grey-50" : "bg-grey-50 text-grey-400"}`}>
          {s.time}{!s.available && <span className="text-[10px] font-medium leading-none">마감</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="pb-32">
      <div className="bg-white px-5 pb-3 pt-3">
        <h1 className="text-[20px] font-bold">예약 신청</h1>
        <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold">
          {["진료", "날짜 · 시간", "확인"].map((l, i) => (
            <span key={l} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${step > i + 1 ? "bg-brand text-white" : step === i + 1 ? "bg-grey-900 text-white" : "bg-grey-100 text-grey-400"}`}>{step > i + 1 ? "✓" : i + 1}</span>
              <span className={step >= i + 1 ? "text-grey-900" : "text-grey-400"}>{l}</span>
              {i < 2 && <span className="h-px w-5 bg-grey-200" />}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-4 pt-3">
        {profiles.length > 1 && (
          <section className="rounded-2xl bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[13px] font-semibold text-grey-500">진료받을 분</span>
              <div className="flex flex-1 flex-wrap justify-end gap-1.5">
                {profiles.map((p) => {
                  const on = current?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => choose(p.id)} className={`h-9 rounded-full px-3 text-[14px] font-semibold transition ${on ? "bg-brand text-white" : "bg-grey-100 text-grey-700"}`}>
                      {p.name}<span className={`ml-1 text-[12px] font-medium ${on ? "text-white/80" : "text-grey-500"}`}>{p.isChild ? "아이" : "본인"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-[12px] text-grey-400">목록에 없는 아이는 첫 방문 때 데스크에서 보호자 번호로 등록해 드려요.</p>
          </section>
        )}

        {overdue && proc?.name !== "정기 검진" && (
          <button onClick={() => setProc(procs.find((p) => p.name === "정기 검진") || null)} className="flex w-full items-center justify-between rounded-2xl bg-warning-weak px-4 py-3 text-left">
            <span>
              <span className="block text-[15px] font-bold text-warning">{current?.name} 정기 검진 시기가 지났어요</span>
              <span className="block text-[13px] text-grey-700">마지막 검진 후 6개월이 지났어요. 누르면 정기 검진으로 골라 드려요.</span>
            </span>
            <span className="text-warning">›</span>
          </button>
        )}

        <section className="rounded-3xl bg-white p-5">
          <h2 className="text-[16px] font-bold">어떤 진료를 받으세요?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {procs.map((p) => (
              <button key={p.id} onClick={() => setProc(p)} className={`relative rounded-xl border-2 px-3 py-2.5 text-left transition ${proc?.id === p.id ? "border-brand bg-brand-weak" : "border-transparent bg-grey-50"}`}>
                <p className="text-[15px] font-semibold">{p.name}</p>
                <p className="mt-0.5 text-[12px] text-grey-500">약 {p.duration_min}분</p>
                {proc?.id === p.id && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] text-white">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {proc && (
          <section className="rounded-3xl bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-bold">날짜</h2>
              <span className="text-[13px] font-semibold text-grey-500">{Number(date.slice(5, 7))}월 · 일요일 휴진</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {days.map((d) => (
                <button key={d} onClick={() => setDate(d)} className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl transition ${date === d ? "bg-brand text-white" : "bg-grey-50"}`}>
                  <span className={`text-[12px] font-medium ${date === d ? "text-white/80" : dowOf(d) === "토" ? "text-brand" : "text-grey-500"}`}>{dowOf(d)}</span>
                  <span className="text-[16px] font-bold">{Number(d.slice(8))}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-baseline justify-between">
              <h2 className="text-[16px] font-bold">시간</h2>
              {slots && slots.length > 0 && <span className="text-[13px] text-grey-500">예약 가능 <b className="text-brand">{openCount}</b>개</span>}
            </div>
            {!slots ? <Spinner /> : slots.length === 0 ? <p className="mt-3 rounded-xl bg-grey-50 p-4 text-center text-[14px] text-grey-500">이 날은 예약할 수 있는 시간이 없어요. 다른 날을 골라 주세요.</p> : (
              <>
                {am.length > 0 && <><p className="mt-3 text-[13px] font-semibold text-grey-500">오전</p><SlotGrid list={am} /></>}
                {pm.length > 0 && <><p className="mt-4 text-[13px] font-semibold text-grey-500">오후 <span className="font-normal">· 점심시간 13:00~14:00 제외</span></p><SlotGrid list={pm} /></>}
                <p className="mt-3 text-[12px] text-grey-400">진료 의자 5대 중 빈 의자가 있는 시간만 고를 수 있어요.</p>
              </>
            )}
          </section>
        )}
        <ErrorText>{err}</ErrorText>
      </div>

      <div className="fixed bottom-16 left-1/2 z-10 w-full max-w-[480px] -translate-x-1/2 border-t border-grey-200 bg-white px-5 pb-3 pt-3">
        {proc && time && (
          <div className="mb-2 flex items-center justify-between text-[14px]">
            <span className="text-grey-500">{current && profiles.length > 1 ? `${current.name} · ` : ""}{proc.name}</span>
            <span className="font-semibold">{md(date)} {time}</span>
          </div>
        )}
        <Button className="w-full" disabled={!proc || !time || busy} onClick={submit}>
          {busy ? "예약하는 중..." : proc && time ? "이 시간으로 예약하기" : !proc ? "진료를 골라 주세요" : "시간을 골라 주세요"}
        </Button>
      </div>
    </div>
  );
}

export default function BookPage() {
  return <Suspense fallback={<Spinner />}><Book /></Suspense>;
}

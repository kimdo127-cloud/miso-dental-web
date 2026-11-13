"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Plus, LogOut } from "lucide-react";
import { api, Profile, session } from "@/lib/api";
import { useProfile, PageTitle } from "@/components/shell";
import { Button, ErrorText } from "@/components/ui";

// 마이: 가족(진료받을 사람) 고르기 · 아이 등록 · 로그아웃
export default function MyPage() {
  const router = useRouter();
  const { profiles, current, choose, setProfiles } = useProfile();
  const owner = profiles.find((p) => p.isOwner);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [guardian, setGuardian] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  async function add() {
    setBusy(true); setErr("");
    try {
      const r = await api<{ id: number; profiles: Profile[] }>("/patient/children", { body: { name, birthDate: birth, guardianName: guardian, consent } });
      setProfiles(r.profiles); setDone(`${name} 아이를 등록했어요`);
      setOpen(false); setName(""); setBirth(""); setGuardian(""); setConsent(false);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const input = "h-12 w-full rounded-xl border border-grey-200 px-4 text-[16px] outline-none focus:border-brand";
  return (
    <div>
      <PageTitle title="마이" sub={owner ? `${owner.name}님 번호로 확인했어요` : undefined} />
      <div className="space-y-3 px-4 pt-3">
        <section className="rounded-3xl bg-white p-5">
          <h2 className="text-[16px] font-bold">진료받을 사람</h2>
          <p className="mt-0.5 text-[13px] text-grey-500">고른 사람 기준으로 예약 · 상담 · 시술 기록이 보여요</p>
          <ul className="mt-3 space-y-2">
            {profiles.map((p) => (
              <li key={p.id}>
                <button onClick={() => choose(p.id)} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left ${p.id === current?.id ? "bg-brand-weak" : "bg-grey-50"}`}>
                  <span className="text-[15px] font-semibold">{p.name} <span className="text-[13px] font-normal text-grey-500">{p.isChild ? `아이 · ${p.age}세` : `본인 · ${p.age}세`}</span></span>
                  {p.id === current?.id && <Check className="text-brand" size={18} />}
                </button>
              </li>
            ))}
          </ul>
          {done && <p className="mt-3 rounded-xl bg-success-weak px-4 py-2.5 text-[14px] text-success">{done}</p>}
          {!open ? (
            <button onClick={() => { setOpen(true); setDone(""); }} className="mt-2 flex items-center gap-1 px-1 py-2 text-[15px] font-semibold text-brand"><Plus size={16} /> 가족 추가</button>
          ) : (
            <div className="mt-4 space-y-2.5 rounded-2xl bg-grey-50 p-4">
              <p className="text-[15px] font-bold">가족 추가</p>
              <input className={input} placeholder="아이 이름" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={input} type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
              <p className="pt-1 text-[13px] font-semibold text-grey-700">보호자 확인</p>
              <input className={input} placeholder="휴대폰 주인(보호자) 이름" value={guardian} onChange={(e) => setGuardian(e.target.value)} />
              <label className="flex items-start gap-2 text-[13px] text-grey-700">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                아이의 법정대리인으로서 진료 예약 · 상담에 필요한 개인정보 수집에 동의해요 (만 19세 미만만 등록)
              </label>
              <ErrorText>{err}</ErrorText>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="secondary" onClick={() => { setOpen(false); setErr(""); }}>취소</Button>
                <Button disabled={busy || !name.trim() || !birth || !guardian.trim() || !consent} onClick={add}>{busy ? "등록 중..." : "등록"}</Button>
              </div>
            </div>
          )}
        </section>
        <button onClick={() => { session.clear(); router.replace("/"); }} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-[15px] font-medium text-grey-500"><LogOut size={16} /> 다른 번호로 확인하기 (로그아웃)</button>
      </div>
    </div>
  );
}

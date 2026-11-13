"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Profile, session } from "@/lib/api";
import { Button, ErrorText } from "@/components/ui";

// 시드 데이터의 시연 계정 (backend/src/db/seed.ts, 가상 환자)
const TEST_ACCOUNTS = [
  { label: "보호자", sub: "박지연 · 하준·서아 엄마", phone: "01055556666", name: "박지연" },
  { label: "성인 환자", sub: "김민지 · 사랑니 발치 후", phone: "01012345678", name: "김민지" },
];

const nextPath = () => { const n = new URLSearchParams(window.location.search).get("next"); return n && n.startsWith("/") && !n.startsWith("//") ? n : null; };

// P1 본인 확인: 휴대폰 번호 + 이름 (아이는 보호자 번호 + 아이 또는 보호자 이름)
export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (session.token()) router.replace(nextPath() || "/home"); }, [router]);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(phone, name);
  }

  async function doLogin(phone: string, name: string) {
    setBusy(true); setErr("");
    try {
      const r = await api<{ token: string; profiles: Profile[] }>("/patient/login", { body: { phone, name } });
      const me = r.profiles.find((p) => p.isOwner) || r.profiles[0];
      session.set(r.token, me.id);
      router.replace(nextPath() || "/home");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-16">
      <p className="text-[15px] font-semibold text-brand">미소치과</p>
      <h1 className="mt-2 text-[26px] font-bold leading-snug">예약과 진료 후 궁금한 점,<br />여기서 확인하세요</h1>
      <p className="mt-3 text-[15px] text-grey-500">병원에 등록된 휴대폰 번호와 이름으로 본인 확인을 해요. 아이 진료는 부모님 번호로 확인한 뒤 고를 수 있어요.</p>

      <form onSubmit={submit} className="mt-10 space-y-4">
        <label className="block">
          <span className="text-[14px] font-medium text-grey-700">휴대폰 번호</span>
          <input inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(fmt(e.target.value))} placeholder="010-0000-0000"
            className="mt-2 h-14 w-full rounded-m border border-grey-200 px-4 text-[17px] outline-none focus:border-brand" />
        </label>
        <label className="block">
          <span className="text-[14px] font-medium text-grey-700">이름 (휴대폰 주인)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동"
            className="mt-2 h-14 w-full rounded-m border border-grey-200 px-4 text-[17px] outline-none focus:border-brand" />
        </label>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" disabled={busy || phone.replace(/\D/g, "").length < 10 || !name.trim()} className="w-full">{busy ? "확인 중..." : "확인"}</Button>
      </form>

      {/* 테스트용: 시연 계정으로 바로 로그인 (가상 환자) */}
      <div className="mt-auto border-t border-grey-200 pt-6 pb-8">
        <p className="mb-3 text-[12px] font-semibold text-grey-500">테스트 계정으로 로그인</p>
        <div className="grid grid-cols-2 gap-2">
          {TEST_ACCOUNTS.map((t) => (
            <button key={t.phone} type="button" disabled={busy} onClick={() => doLogin(t.phone, t.name)}
              className="rounded-xl border border-grey-200 bg-white px-2 py-3 text-center active:bg-grey-50 disabled:opacity-40">
              <span className="block text-[14px] font-semibold">{t.label}</span>
              <span className="mt-0.5 block text-[11px] text-grey-500">{t.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

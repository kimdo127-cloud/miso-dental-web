"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Bell, CalendarDays, Home, MessageCircle, Check, UserRound } from "lucide-react";
import { api, Profile, session } from "@/lib/api";

type Ctx = { profiles: Profile[]; current: Profile | null; choose: (id: number) => void; version: number; setProfiles: (p: Profile[]) => void };
const ProfileCtx = createContext<Ctx>({ profiles: [], current: null, choose: () => {}, version: 0, setProfiles: () => {} });
export const useProfile = () => useContext(ProfileCtx);

const TABS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/chat", label: "AI 상담", icon: MessageCircle },
  { href: "/appointments", label: "내 진료", icon: CalendarDays },
  { href: "/my", label: "마이", icon: UserRound },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [current, setCurrent] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [unread, setUnread] = useState(0);
  useEffect(() => { if (session.token()) api<{ unread?: number }>("/me").then((m) => setUnread(m.unread || 0)).catch(() => {}); }, [path, version]);

  useEffect(() => {
    if (!session.token()) { router.replace("/"); return; }
    api<Profile[]>("/profiles").then((ps) => {
      setProfiles(ps);
      const saved = Number(session.patientId());
      const cur = ps.find((p) => p.id === saved) || ps[0];
      if (cur) { session.setPatient(cur.id); setCurrent(cur); }
    }).catch(() => {});
  }, [router]);

  const choose = useCallback((id: number) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    session.setPatient(id); setCurrent(p); setOpen(false); setVersion((v) => v + 1);
  }, [profiles]);

  if (!current) return <div className="min-h-dvh bg-grey-100" />;
  const family = profiles.length > 1;

  return (
    <ProfileCtx.Provider value={{ profiles, current, choose, version, setProfiles }}>
      <div className="flex min-h-dvh flex-col bg-grey-100">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white px-5">
          <span className="text-[17px] font-bold text-brand">미소치과</span>
          <Link href="/notifications" aria-label="알림" className="relative flex h-9 w-9 items-center justify-center rounded-full text-grey-700"><Bell size={22} />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />}</Link>
        </header>

        <main key={version} className="flex-1 pb-24">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-4 border-t border-grey-200 bg-white pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = path.startsWith(href) || (href === "/appointments" && (path.startsWith("/book") || path.startsWith("/treatments")));
            return (
              <Link key={href} href={href} className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-grey-900" : "text-grey-400"}`}>
                <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />{label}
              </Link>
            );
          })}
        </nav>

        {open && (
          <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 animate-fade" onClick={() => setOpen(false)}>
            <div className="w-full max-w-[480px] rounded-t-3xl bg-white p-6 pb-10 animate-sheet" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-[20px] font-bold">{family ? "누구 진료인가요?" : "내 정보"}</h2>
              <p className="mt-1 text-[14px] text-grey-500">{family ? "고른 사람 기준으로 예약 · 상담 · 시술 기록이 보여요." : "보호자 번호에 아이가 등록되면 여기서 아이를 골라 예약할 수 있어요."}</p>
              <ul className="mt-5 space-y-2">
                {profiles.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => choose(p.id)} className={`flex w-full items-center justify-between rounded-m px-4 py-4 text-left ${p.id === current.id ? "bg-brand-weak" : "bg-grey-50"}`}>
                      <span className="text-[16px] font-semibold">{p.name} <span className="text-[14px] font-normal text-grey-500">{p.isChild ? `아이 · ${p.age}세` : `본인 · ${p.age}세`}</span></span>
                      {p.id === current.id && <Check className="text-brand" size={20} />}
                    </button>
                  </li>
                ))}
              </ul>
              <button onClick={() => { session.clear(); router.replace("/"); }} className="mt-5 w-full py-3 text-[15px] font-medium text-grey-500">다른 번호로 확인하기 (로그아웃)</button>
            </div>
          </div>
        )}
      </div>
    </ProfileCtx.Provider>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="bg-white px-5 pb-5 pt-4">
      <h1 className="text-[24px] font-bold leading-snug">{title}</h1>
      {sub && <p className="mt-1 text-[15px] text-grey-500">{sub}</p>}
    </div>
  );
}

// 내 진료: 예약 · 받은 시술을 한 탭에서
export function CareHeader({ active, sub }: { active: "appointments" | "treatments"; sub?: string }) {
  return (
    <div className="bg-white px-5 pb-4 pt-4">
      <h1 className="text-[24px] font-bold leading-snug">내 진료</h1>
      {sub && <p className="mt-1 text-[14px] text-grey-500">{sub}</p>}
      <div className="mt-4 grid grid-cols-2 rounded-xl bg-grey-100 p-1 text-[15px] font-semibold">
        <Link href="/appointments" className={`rounded-lg py-2 text-center ${active === "appointments" ? "bg-white text-grey-900 shadow-sm" : "text-grey-500"}`}>예약</Link>
        <Link href="/treatments" className={`rounded-lg py-2 text-center ${active === "treatments" ? "bg-white text-grey-900 shadow-sm" : "text-grey-500"}`}>받은 시술 · 주의사항</Link>
      </div>
    </div>
  );
}

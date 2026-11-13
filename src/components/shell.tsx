"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Bell, CalendarDays, ChevronDown, Home, MessageCircle, Stethoscope, Check } from "lucide-react";
import { api, Profile, session } from "@/lib/api";

type Ctx = { profiles: Profile[]; current: Profile | null; choose: (id: number) => void; version: number };
const ProfileCtx = createContext<Ctx>({ profiles: [], current: null, choose: () => {}, version: 0 });
export const useProfile = () => useContext(ProfileCtx);

const TABS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/chat", label: "상담", icon: MessageCircle },
  { href: "/appointments", label: "예약", icon: CalendarDays },
  { href: "/treatments", label: "내 시술", icon: Stethoscope },
  { href: "/notifications", label: "알림", icon: Bell },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [current, setCurrent] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);

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
    <ProfileCtx.Provider value={{ profiles, current, choose, version }}>
      <div className="flex min-h-dvh flex-col bg-grey-100">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white px-5">
          <span className="text-[17px] font-bold text-brand">미소치과</span>
          {family ? (
            <button onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-full bg-grey-100 py-1.5 pl-3 pr-2 text-[14px] font-semibold text-grey-900">
              <span className="text-grey-500">진료받을 사람</span> {current.name}{current.isChild ? " (아이)" : ""} <ChevronDown size={16} />
            </button>
          ) : <span className="text-[14px] font-semibold text-grey-700">{current.name}님</span>}
        </header>

        <main key={version} className="flex-1 pb-24">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-5 border-t border-grey-200 bg-white pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = path.startsWith(href) || (href === "/appointments" && path.startsWith("/book"));
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
              <h2 className="text-[20px] font-bold">누구 진료인가요?</h2>
              <p className="mt-1 text-[14px] text-grey-500">고른 사람 기준으로 예약 · 상담 · 시술 기록이 보여요.</p>
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

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, MessageCircle, CalendarPlus, Stethoscope, Phone, Clock, Sparkles } from "lucide-react";
import { api, fmtDateTime } from "@/lib/api";
import { useProfile } from "@/components/shell";
import { Badge, Spinner } from "@/components/ui";

type Me = {
  id: number; ownerName: string | null; name: string; isChild: boolean; unread: number; nextCheckupDue: string | null; checkupOverdue: boolean;
  nextAppointment: { id: number; start_at: string; confirm_status: string; procedure: string } | null;
  familyUpcoming: { id: number; start_at: string; confirm_status: string; procedure: string; patient_id: number; patient: string }[];
};

const QUICK_QUESTIONS = ["사랑니 뺐는데 술은 언제부터?", "임플란트 하고 운동해도 돼요?", "스케일링 보험 되나요?"];

// 진료 시간: 평일 09:30~18:30(점심 13~14), 토 09:30~13:00, 일 휴진 (KST)
function clinicStatus() {
  const now = new Date(Date.now() + 9 * 3600e3);
  const d = now.getUTCDay(), m = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (d === 0) return { open: false, text: "오늘은 휴진이에요" };
  const end = d === 6 ? 13 * 60 : 18 * 60 + 30;
  if (m < 9 * 60 + 30 || m >= end) return { open: false, text: "지금은 진료 시간이 아니에요" };
  if (d !== 6 && m >= 13 * 60 && m < 14 * 60) return { open: false, text: "점심시간이에요 (14:00 진료 시작)" };
  return { open: true, text: `지금 진료 중 · ${d === 6 ? "13:00" : "18:30"}까지` };
}

function dDay(iso: string) {
  const kst = (t: number) => Math.floor((t + 9 * 3600e3) / 86400e3);
  const n = kst(new Date(iso).getTime()) - kst(Date.now());
  return n === 0 ? "오늘" : n === 1 ? "내일" : `D-${n}`;
}

// P2 홈: 다음 예약 · 바로 상담
export default function HomePage() {
  const { current, profiles } = useProfile();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { api<Me>("/me").then(setMe).catch(() => {}); }, []);
  const family = profiles.length > 1;
  if (!me) return <Spinner />;
  const others = me.familyUpcoming.filter((a) => a.patient_id !== me.id);
  const who = family ? `${me.name}${current?.isChild ? "(아이)" : ""}` : "";
  const status = clinicStatus();
  const next = me.nextAppointment;

  return (
    <div className="space-y-3 px-4 pb-4 pt-4">
      <div className="px-1 pb-1">
        <h1 className="text-[22px] font-bold leading-snug">{me.ownerName ? `${me.ownerName}님` : "보호자님"}, 안녕하세요</h1>
        <p className="mt-1 text-[14px] text-grey-500">{family ? `지금 ${who} 기준으로 보고 있어요` : "오늘도 건강한 치아 지켜 드릴게요"}</p>
      </div>

      {/* 다음 예약 */}
      {next ? (
        <Link href="/appointments" className="block rounded-3xl bg-brand p-5 text-white shadow-[0_8px_24px_rgba(49,130,246,.25)]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-white/80">{who ? `${who} · ` : ""}다음 예약</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-bold">{dDay(next.start_at)}</span>
          </div>
          <p className="mt-3 text-[24px] font-bold leading-tight">{fmtDateTime(next.start_at)}</p>
          <p className="mt-1 text-[15px] text-white/90">{next.procedure}</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/15 px-4 py-3 text-[14px] font-semibold">
            {next.confirm_status === "미확인" ? "방문 여부를 알려 주세요" : `방문 확인: ${next.confirm_status}`}
            <ChevronRight size={18} />
          </div>
        </Link>
      ) : (
        <div className="rounded-3xl bg-white p-5">
          <p className="text-[13px] font-semibold text-grey-500">{who ? `${who} · ` : ""}다음 예약</p>
          <p className="mt-2 text-[18px] font-bold">예정된 예약이 없어요</p>
          <p className="mt-1 text-[14px] text-grey-500">빈 의자가 있는 시간만 보여 드려서 바로 예약돼요.</p>
          <Link href="/book" className="mt-4 flex h-12 items-center justify-center rounded-xl bg-brand text-[16px] font-semibold text-white">예약하기</Link>
        </div>
      )}

      {me.checkupOverdue && (
        <Link href="/book?procedure=정기 검진" className="flex items-center justify-between rounded-2xl bg-warning-weak p-4">
          <div>
            <p className="text-[15px] font-bold text-warning">{who ? `${who} ` : ""}정기 검진 시기가 지났어요</p>
            <p className="mt-0.5 text-[13px] text-grey-700">마지막 검진 후 6개월이 지났어요. 지금 예약해 보세요.</p>
          </div>
          <ChevronRight className="text-warning" />
        </Link>
      )}

      {/* AI 상담 */}
      <div className="rounded-3xl bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-weak text-brand"><Sparkles size={16} /></span>
          <p className="text-[16px] font-bold">진료 후 궁금한 점, 밤에도 바로 답해요</p>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-grey-500">병원 주의사항 · 보험 기준 자료로 답하고 근거 쪽수를 보여 드려요.</p>
        <div className="mt-3 flex flex-col gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <Link key={q} href={`/chat?q=${encodeURIComponent(q)}`} className="flex items-center justify-between rounded-xl bg-grey-50 px-4 py-3 text-[14px] text-grey-900">
              <span>“{q}”</span><ChevronRight size={16} className="text-grey-400" />
            </Link>
          ))}
        </div>
        <Link href="/chat" className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-weak text-[15px] font-semibold text-brand">
          <MessageCircle size={18} /> 직접 물어보기
        </Link>
      </div>

      {/* 바로가기 */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { href: "/book", label: "예약 신청", sub: "빈 시간 바로 확인", icon: CalendarPlus },
          { href: "/treatments", label: "받은 시술", sub: "주의사항 다시 보기", icon: Stethoscope },
        ].map(({ href, label, sub, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grey-100 text-grey-700"><Icon size={20} /></span>
            <span><span className="block text-[15px] font-semibold">{label}</span><span className="block text-[12px] text-grey-500">{sub}</span></span>
          </Link>
        ))}
      </div>

      {family && (
        <div className="rounded-3xl bg-white p-5">
          <p className="text-[16px] font-bold">가족 예약</p>
          {others.length === 0 ? <p className="mt-2 text-[14px] text-grey-500">다른 가족의 예정된 예약이 없어요</p> : (
            <ul className="mt-2 divide-y divide-grey-100">
              {others.map((a) => (
                <li key={a.id}>
                  <Link href="/appointments" className="flex items-center gap-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-weak text-[13px] font-bold text-brand">{a.patient.length > 2 ? a.patient.slice(1, 3) : a.patient}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold">{a.patient} · {a.procedure}</p>
                      <p className="text-[13px] text-grey-500">{fmtDateTime(a.start_at)}</p>
                    </div>
                    {a.confirm_status === "미확인" ? <Badge tone="warning">확인 필요</Badge> : <Badge tone="success">{a.confirm_status}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 병원 정보 */}
      <div className="rounded-3xl bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[15px] font-bold"><Clock size={16} className="text-grey-500" /> 진료 시간</p>
          <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${status.open ? "text-success" : "text-grey-500"}`}>
            <span className={`h-2 w-2 rounded-full ${status.open ? "bg-success" : "bg-grey-400"}`} />{status.text}
          </span>
        </div>
        <dl className="mt-3 space-y-1.5 text-[14px]">
          <div className="flex justify-between"><dt className="text-grey-500">평일</dt><dd>09:30 ~ 18:30</dd></div>
          <div className="flex justify-between"><dt className="text-grey-500">점심시간</dt><dd>13:00 ~ 14:00</dd></div>
          <div className="flex justify-between"><dt className="text-grey-500">토요일</dt><dd>09:30 ~ 13:00</dd></div>
          <div className="flex justify-between"><dt className="text-grey-500">일요일 · 공휴일</dt><dd className="text-danger">휴진</dd></div>
        </dl>
        <a href="tel:0212345678" className="mt-4 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-grey-100 text-[15px] font-semibold text-grey-900">
          <Phone size={16} /> 병원에 전화하기 02-1234-5678
        </a>
      </div>
    </div>
  );
}

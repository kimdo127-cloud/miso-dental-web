"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, MessageCircle, CalendarPlus, Stethoscope } from "lucide-react";
import { api, fmtDateTime } from "@/lib/api";
import { useProfile } from "@/components/shell";
import { Badge, Card, Spinner } from "@/components/ui";

type Me = {
  id: number; name: string; isChild: boolean; unread: number; nextCheckupDue: string | null; checkupOverdue: boolean;
  nextAppointment: { id: number; start_at: string; confirm_status: string; procedure: string } | null;
  familyUpcoming: { id: number; start_at: string; confirm_status: string; procedure: string; patient_id: number; patient: string }[];
};

// P2 홈: 다음 예약 · 바로 상담
export default function HomePage() {
  const { current, profiles } = useProfile();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { api<Me>("/me").then(setMe).catch(() => {}); }, []);
  if (!me) return <Spinner />;
  const family = profiles.length > 1;
  const others = me.familyUpcoming.filter((a) => a.patient_id !== me.id);

  return (
    <div className="space-y-3 pt-3">
      <div className="px-5 pb-1 pt-2">
        <h1 className="text-[22px] font-bold">{current?.isChild ? `${me.name} 어린이` : `${me.name}님`}, 안녕하세요</h1>
      </div>

      <Card className="mx-4">
        <p className="text-[14px] font-medium text-grey-500">다음 예약</p>
        {me.nextAppointment ? (
          <Link href="/appointments" className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-[19px] font-bold">{fmtDateTime(me.nextAppointment.start_at)}</p>
              <p className="mt-1 text-[15px] text-grey-700">{me.nextAppointment.procedure}</p>
            </div>
            {me.nextAppointment.confirm_status === "미확인" ? <Badge tone="warning">확인 필요</Badge> : <Badge tone="success">{me.nextAppointment.confirm_status}</Badge>}
          </Link>
        ) : (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[16px] text-grey-700">예정된 예약이 없어요</p>
            <Link href="/book" className="text-[15px] font-semibold text-brand">예약하기</Link>
          </div>
        )}
      </Card>

      {me.checkupOverdue && (
        <Link href="/book?procedure=정기 검진" className="mx-4 flex items-center justify-between rounded-2xl bg-brand-weak p-5">
          <div>
            <p className="text-[16px] font-bold text-brand">정기 검진 시기가 됐어요</p>
            <p className="mt-1 text-[14px] text-grey-700">마지막 검진 후 6개월이 지났어요. 편한 시간에 예약하세요.</p>
          </div>
          <ChevronRight className="text-brand" />
        </Link>
      )}

      <div className="mx-4 grid grid-cols-3 gap-2">
        {[
          { href: "/chat", label: "진료 후 궁금한 점", icon: MessageCircle },
          { href: "/book", label: "예약 신청", icon: CalendarPlus },
          { href: "/treatments", label: "주의사항 다시 보기", icon: Stethoscope },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4">
            <Icon className="text-brand" size={24} />
            <span className="text-[14px] font-semibold leading-snug">{label}</span>
          </Link>
        ))}
      </div>

      {family && (
        <Card className="mx-4">
          <p className="text-[14px] font-medium text-grey-500">가족 예약</p>
          {others.length === 0 ? <p className="mt-2 text-[15px] text-grey-700">다른 가족의 예정된 예약이 없어요</p> : (
            <ul className="mt-2 divide-y divide-grey-100">
              {others.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[15px] font-semibold">{a.patient} · {a.procedure}</p>
                    <p className="text-[14px] text-grey-500">{fmtDateTime(a.start_at)}</p>
                  </div>
                  {a.confirm_status === "미확인" && <Badge tone="warning">확인 필요</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <p className="px-6 pt-2 text-[13px] leading-relaxed text-grey-500">진료 시간 평일 09:30~18:30 (점심 13:00~14:00) · 토요일 09:30~13:00 · 일요일 휴진 · 02-1234-5678</p>
    </div>
  );
}

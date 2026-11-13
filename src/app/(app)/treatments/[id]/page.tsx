"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ChevronLeft, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

type A = { procedure: string; items: { page: number; heading: string; content: string; title: string; edition_year: number }[] };

// P6-1 시술별 주의사항 (종이 대신 다시 보기). 그 시술 자료만 보여 줌
export default function AftercarePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [a, setA] = useState<A | null>(null);
  useEffect(() => { api<A>(`/aftercare/${id}`).then(setA).catch(() => {}); }, [id]);
  if (!a) return <Spinner />;
  return (
    <div>
      <div className="bg-white px-5 pb-5 pt-3">
        <Link href="/treatments" className="-ml-1 flex items-center text-[15px] text-grey-500"><ChevronLeft size={20} /> 받은 시술</Link>
        <h1 className="mt-3 text-[24px] font-bold">{a.procedure} 후 주의사항</h1>
        {a.items[0] && <p className="mt-1 flex items-center gap-1 text-[13px] text-grey-500"><FileText size={14} /> {a.items[0].title}</p>}
      </div>
      <div className="space-y-3 px-4 pt-3">
        {a.items.length === 0 ? <p className="py-10 text-center text-grey-500">이 시술은 따로 주의사항이 없어요.</p> : a.items.map((it) => (
          <div key={it.page + it.heading} className="rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">{it.heading}</h2>
              <span className="text-[12px] text-grey-400">{it.page}쪽</span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-grey-700">{it.content}</p>
          </div>
        ))}
        <Link href="/chat" className="block rounded-2xl bg-brand-weak p-5 text-[15px] font-semibold text-brand">더 궁금한 점은 상담에서 물어보세요</Link>
      </div>
    </div>
  );
}

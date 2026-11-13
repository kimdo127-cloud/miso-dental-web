"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { api, fmtDate } from "@/lib/api";
import { useProfile, PageTitle } from "@/components/shell";
import { Empty, Spinner } from "@/components/ui";

type T = { id: number; treated_at: string; procedure_id: number; procedure: string };

// P6 받은 시술 · 주의사항 (진료 기록 내용은 보이지 않음: 원장 · 담당 위생사만)
export default function TreatmentsPage() {
  const { current } = useProfile();
  const [list, setList] = useState<T[] | null>(null);
  useEffect(() => { api<T[]>("/treatments").then(setList).catch(() => setList([])); }, []);
  return (
    <div>
      <PageTitle title="받은 시술" sub={`${current?.name ?? ""}${current?.isChild ? " (아이)" : ""}의 시술 목록이에요. 누르면 주의사항을 다시 볼 수 있어요.`} />
      <div className="px-4 pt-3">
        {!list ? <Spinner /> : list.length === 0 ? <Empty>받은 시술 기록이 없어요</Empty> : (
          <ul className="overflow-hidden rounded-2xl bg-white">
            {list.map((t) => (
              <li key={t.id} className="border-b border-grey-100 last:border-0">
                <Link href={`/treatments/${t.procedure_id}`} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[16px] font-semibold">{t.procedure}</p>
                    <p className="text-[14px] text-grey-500">{fmtDate(t.treated_at)}</p>
                  </div>
                  <span className="flex items-center text-[14px] text-brand">주의사항 <ChevronRight size={18} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

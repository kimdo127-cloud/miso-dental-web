"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Phone, Siren, Inbox } from "lucide-react";
import { api, ChatResult } from "@/lib/api";
import { useProfile } from "@/components/shell";

type Msg = { role: "me" | "bot"; text: string; result?: ChatResult; past?: boolean };
type History = { question: string; status: string; ai_answer: string | null; desk_answer: string | null };
const EXAMPLES = ["사랑니 뺐는데 술은 언제부터 마셔도 돼요?", "임플란트 하고 운동해도 돼요?", "스케일링 보험 되는 거 맞죠?", "교정 장치 붙이고 떡 먹어도 돼요?"];

// P3 AI 상담: 병원 자료로만 답하고 근거(문서 · 쪽)를 보여 줌. 증상 질문은 답하지 않고 연락처 안내
export default function ChatPage() {
  const { current } = useProfile();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  // 이전 상담과 데스크 답변 (오래된 것부터)
  useEffect(() => {
    api<History[]>("/chat").then((h) => setMsgs(h.slice().reverse().flatMap((x) => [
      { role: "me" as const, text: x.question },
      { role: "bot" as const, text: x.desk_answer ? `데스크 답변: ${x.desk_answer}` : x.ai_answer || (x.status === "증상 안내" ? "증상 질문이라 병원 연락처를 안내해 드렸어요." : "데스크에 전달했어요. 답변이 오면 알림으로 알려 드릴게요."), past: true },
    ]))).catch(() => {});
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput(""); setBusy(true);
    setMsgs((m) => [...m, { role: "me", text: q }]);
    try {
      const r = await api<ChatResult>("/chat", { body: { question: q } });
      setMsgs((m) => [...m, { role: "bot", text: r.answer, result: r }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "bot", text: (e as Error).message }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px-64px)] flex-col">
      <div className="flex-1 space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-white p-5">
          <p className="text-[17px] font-bold">진료 후 궁금한 점을 물어보세요</p>
          <p className="mt-1 text-[14px] leading-relaxed text-grey-500">
            {current?.isChild ? `${current.name}(아이) 질문으로 기록돼요. ` : ""}시술 후 주의사항과 보험 기준을 병원 자료로 답해 드려요. 지금 증상이 괜찮은지는 진료가 필요해 답해 드릴 수 없어요.
          </p>
          {!msgs.some((m) => !m.past) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((e) => <button key={e} onClick={() => send(e)} className="rounded-full bg-grey-100 px-3 py-2 text-left text-[13px] text-grey-700">{e}</button>)}
            </div>
          )}
        </div>

        {msgs.map((m, i) => m.role === "me" ? (
          <div key={i} className="flex justify-end"><p className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-[15px] text-white">{m.text}</p></div>
        ) : <BotMessage key={i} m={m} />)}
        {busy && <div className="flex"><p className="rounded-2xl bg-white px-4 py-3 text-[15px] text-grey-500">병원 자료를 찾고 있어요...</p></div>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="sticky bottom-16 flex items-center gap-2 border-t border-grey-200 bg-white px-4 py-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="예: 임플란트 하고 술 마셔도 돼요?" className="h-12 flex-1 rounded-full bg-grey-100 px-4 text-[15px] outline-none" />
        <button disabled={!input.trim() || busy} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white disabled:opacity-30"><ArrowUp size={20} /></button>
      </form>
    </div>
  );
}

function BotMessage({ m }: { m: Msg }) {
  const r = m.result;
  if (r?.type === "symptom") {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold text-danger"><Siren size={18} /> 증상 질문이에요</p>
        <p className="mt-2 text-[15px] leading-relaxed">{r.answer}</p>
        <div className={`mt-3 rounded-m p-3 text-[14px] leading-relaxed ${r.clinic.open ? "bg-brand-weak text-grey-900" : "bg-danger-weak text-grey-900"}`}>{r.clinic.message}</div>
        {r.clinic.open
          ? <a href={`tel:${r.clinic.phone}`} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-m bg-brand text-[15px] font-semibold text-white"><Phone size={16} /> 병원에 전화하기 ({r.clinic.phone})</a>
          : <a href="tel:119" className="mt-3 flex h-11 items-center justify-center gap-2 rounded-m bg-danger text-[15px] font-semibold text-white"><Siren size={16} /> 119 응급 전화</a>}
      </div>
    );
  }
  if (r?.type === "handoff") {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold text-grey-700"><Inbox size={18} /> 데스크에 전달했어요</p>
        <p className="mt-2 text-[15px] leading-relaxed">{r.answer}</p>
        <p className="mt-2 text-[13px] text-grey-500">급하면 진료 시간에 {r.clinic.phone}로 전화해 주세요.</p>
      </div>
    );
  }
  return (
    <div className={`max-w-[90%] rounded-2xl rounded-bl-md p-4 ${m.past ? "bg-grey-50 text-grey-700" : "bg-white"}`}>
      <p className="text-[15px] leading-relaxed">{m.text}</p>
      {r?.sources?.length ? (
        <div className="mt-3 space-y-2 border-t border-grey-100 pt-3">
          <p className="text-[12px] font-semibold text-grey-500">근거 자료</p>
          {r.sources.map((s, i) => (
            <details key={i} className="rounded-m bg-grey-50 px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-grey-700">
                <FileText size={14} className="shrink-0 text-brand" /> {s.document} · {s.page}쪽{s.heading ? ` · ${s.heading}` : ""}
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-grey-700">{s.excerpt}</p>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}

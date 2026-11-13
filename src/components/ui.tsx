"use client";
import { Loader2 } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const v = variant === "primary" ? "bg-brand text-white active:bg-[#1b64da]" : variant === "danger" ? "bg-danger-weak text-danger" : "bg-grey-100 text-grey-700 active:bg-grey-200";
  return <button {...p} className={`h-12 rounded-m px-4 text-[16px] font-semibold transition disabled:opacity-40 ${v} ${className}`}>{children}</button>;
}

export function Card({ children, className = "", ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`rounded-2xl bg-white p-5 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "grey" }: { children: React.ReactNode; tone?: "grey" | "brand" | "danger" | "success" | "warning" }) {
  const t = { grey: "bg-grey-100 text-grey-700", brand: "bg-brand-weak text-brand", danger: "bg-danger-weak text-danger", success: "bg-success-weak text-success", warning: "bg-warning-weak text-warning" }[tone];
  return <span className={`inline-flex h-6 items-center rounded-s px-2 text-[12px] font-semibold ${t}`}>{children}</span>;
}

export function Spinner() {
  return <div className="flex justify-center py-10 text-grey-400"><Loader2 className="animate-spin" /></div>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-m bg-danger-weak px-4 py-3 text-[14px] text-danger">{children}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-[15px] text-grey-500">{children}</p>;
}

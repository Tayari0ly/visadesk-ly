"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/client";

export type SessionUserLite = {
  id: number;
  username: string;
  fullName: string;
  role: "owner" | "admin" | "super_admin" | "company_admin" | "branch_admin" | "supervisor" | "employee" | "viewer";
  branchId?: number | null;
};

export function LoginForm({ onLoggedIn }: { onLoggedIn?: (user: SessionUserLite) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || "بيانات الدخول غير صحيحة");
        return;
      }
      if (onLoggedIn) {
        onLoggedIn(json.user as SessionUserLite);
      } else {
        try {
          window.location.replace("/");
        } catch {
          /* navigation blocked: keep the form but show success */
          setError("");
        }
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/images/visadesk-ly-logo.svg" alt="VisaDesk LY" width={52} height={52} className="h-12 w-12 object-contain" priority />
          <div>
            <div className="text-xl font-bold text-[#1a4f8b]">VisaDesk LY</div>
            <div className="text-[11px] text-[#3db7d4] font-semibold">TRAVEL &amp; TOURISM SOLUTIONS</div>
          </div>
        </div>

        <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستخدم</label>
        <input
          className="w-full mb-3 p-2.5 border border-slate-300 rounded-lg text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="block text-xs font-semibold text-slate-700 mb-1">كلمة المرور</label>
        <input
          type="password"
          className="w-full mb-4 p-2.5 border border-slate-300 rounded-lg text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#1a4f8b] text-white text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { FolderOpen, LogOut, Users } from "lucide-react";
import Image from "next/image";

export type AppUser = {
  id: number;
  username: string;
  fullName: string;
  role: "owner" | "admin" | "super_admin" | "company_admin" | "branch_admin" | "supervisor" | "employee" | "viewer";
  branchId?: number | null;
};

interface HeaderProps {
  activeTab: "filler" | "guide" | "saved";
  setActiveTab: (tab: "filler" | "guide" | "saved") => void;
  onOpenGuide: () => void;
  savedCount?: number;
  user?: AppUser | null;
  onLogout?: () => void;
  onOpenUsers?: () => void;
  onNewForm?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  savedCount = 0,
  user,
  onLogout,
  onOpenUsers,
  onNewForm,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/images/visadesk-ly-logo.svg" alt="VisaDesk LY" width={52} height={52} className="h-12 w-12 object-contain" priority />
          <div className="leading-none">
            <div className="text-[22px] font-bold tracking-tight text-[#1a4f8b]">VisaDesk</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-[#3db7d4]">LY</span>
              <span className="hidden sm:inline text-[10px] font-semibold tracking-wide text-[#1a4f8b]">
                TRAVEL &amp; TOURISM SOLUTIONS
              </span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => {
              onNewForm?.();
              setActiveTab("filler");
            }}
            className={`px-3 py-1.5 rounded-md text-sm ${
              activeTab === "filler" ? "bg-[#1a4f8b] text-white" : "text-[#1a4f8b] hover:bg-slate-100"
            }`}
          >
            استمارة جديدة
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 ${
              activeTab === "saved" ? "bg-[#1a4f8b] text-white" : "text-[#1a4f8b] hover:bg-slate-100"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            ملفاتي
            {savedCount > 0 && (
              <span className="text-[10px] bg-[#3db7d4] text-white rounded-full px-1.5 font-bold">{savedCount}</span>
            )}
          </button>
          {(user?.role === "owner" || user?.role === "admin" || user?.role === "super_admin" || user?.role === "company_admin" || user?.role === "branch_admin") && (
            <button onClick={onOpenUsers} className="px-3 py-1.5 rounded-md text-sm text-[#1a4f8b] hover:bg-slate-100 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              الحسابات
            </button>
          )}
          {(user?.role === "owner" || user?.role === "super_admin" || user?.role === "admin") && (
            <button onClick={() => { window.location.href = "/owner"; }} className="px-3 py-1.5 rounded-md text-sm text-[#1a4f8b] hover:bg-slate-100">
              لوحة المالك
            </button>
          )}
          {(user?.role === "company_admin" || user?.role === "branch_admin" || user?.role === "supervisor") && (
            <button onClick={() => { window.location.href = "/company"; }} className="px-3 py-1.5 rounded-md text-sm text-[#1a4f8b] hover:bg-slate-100">
              بوابة الشركة
            </button>
          )}
          {user && (
            <span className="hidden md:inline text-xs text-slate-500 px-2">{user.username}</span>
          )}
          <button onClick={onLogout} className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100">
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}

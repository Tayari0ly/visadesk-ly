"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/client";

type UserRow = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
};

export function UsersModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [list, setList] = useState<UserRow[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");

  const load = async () => {
    const res = await apiFetch("/api/users");
    const json = await res.json();
    if (json.success) setList(json.users || []);
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  if (!isOpen) return null;

  const create = async () => {
    setError("");
    const res = await apiFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, fullName, role }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error || "تعذر الإنشاء");
      return;
    }
    setUsername("");
    setPassword("");
    setFullName("");
    setRole("employee");
    await load();
  };

  const toggle = async (u: UserRow) => {
    await apiFetch(`/api/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("حذف هذا الحساب؟")) return;
    await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">الحسابات</h3>
          <button onClick={onClose} className="p-1 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="border rounded-md p-2 text-sm" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="border rounded-md p-2 text-sm" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className="border rounded-md p-2 text-sm" placeholder="الاسم" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <select className="border rounded-md p-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="employee">موظف</option>
              <option value="admin">أدمن</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={create} className="px-3 py-1.5 bg-[#1a4f8b] text-white rounded-md text-xs">
            إنشاء حساب
          </button>

          <div className="divide-y border rounded-md">
            {list.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-semibold">{u.username}</div>
                  <div className="text-xs text-slate-500">
                    {u.fullName} · {u.role === "admin" ? "أدمن" : "موظف"} · {u.active ? "نشط" : "موقوف"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggle(u)} className="text-xs px-2 py-1 border rounded">
                    {u.active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button onClick={() => remove(u.id)} className="text-xs px-2 py-1 border rounded text-red-600">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

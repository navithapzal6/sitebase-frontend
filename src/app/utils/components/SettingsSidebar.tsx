"use client";

import { usePathname, useRouter } from "next/navigation";
import { ListChecks, ShieldCheck } from "lucide-react";

const SETTINGS_MENU = [
  {
    label: "User Access",
    route: "/settings/user-access",
    icon: ShieldCheck,
  },
  {
    label: "Mandatory Fields",
    route: "/settings/mandatory-fields",
    icon: ListChecks,
  },
] as const;

export default function SettingsSidebar() {
  const router = useRouter();
  const pathname = usePathname() || "/settings/user-access";

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-50/70 p-3 md:w-[215px] md:border-b-0 md:border-r">
      <div className="mb-2 px-2 py-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Settings
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {SETTINGS_MENU.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.route || pathname.startsWith(`${item.route}/`);

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => router.push(item.route)}
              className={`flex min-w-fit items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors md:w-full ${
                active
                  ? "bg-gradient-to-r from-[#103BB5] to-[#3558D4] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

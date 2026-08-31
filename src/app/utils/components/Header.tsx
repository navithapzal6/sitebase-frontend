"use client";

import { Bell, ChevronDown, Mail, Menu, Search } from "lucide-react";

type HeaderProps = {
  title: string;
  username?: string;
  userType?: string;
  onMenuClick?: () => void;
};

function HeaderIconButton({
  icon: Icon,
  label,
  showDot,
}: {
  icon: typeof Bell;
  label: string;
  showDot?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon size={16} strokeWidth={1.9} />
      {showDot && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#103BB5] ring-2 ring-white" />
      )}
    </button>
  );
}

export default function Header({
  title,
  username = "User",
  userType = "Account",
  onMenuClick,
}: HeaderProps) {
  const initial = username.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="mx-3 mt-3 flex h-16 shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm sm:px-4 lg:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div
          aria-label={`Search ${title}`}
          className="flex h-9 w-full max-w-[390px] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-slate-400 sm:max-w-[430px] lg:max-w-[470px]"
        >
          <Search size={15} strokeWidth={1.9} />
          <span className="truncate text-[12px]">Search here...</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <HeaderIconButton icon={Mail} label="Messages" />
        <HeaderIconButton icon={Bell} label="Notifications" showDot />

        <div className="ml-0.5 hidden items-center gap-2.5 rounded-xl px-1.5 py-1 sm:flex">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#103BB5] to-[#4B6FE8] text-[13px] font-semibold text-white shadow-sm">
            {initial}
          </div>

          <div className="hidden min-w-0 leading-tight md:block">
            <p className="max-w-[130px] truncate text-[12.5px] font-semibold text-slate-800">
              {username}
            </p>
            <p className="mt-0.5 max-w-[130px] truncate text-[10.5px] text-slate-400">
              {userType}
            </p>
          </div>

          <ChevronDown
            size={14}
            className="hidden shrink-0 text-slate-600 md:block"
          />
        </div>
      </div>
    </header>
  );
}

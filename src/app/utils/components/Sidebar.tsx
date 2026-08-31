"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Boxes,
  Building2,
  ChevronDown,
  CircleUserRound,
  FolderKanban,
  LogOut,
  Plus,
  Settings,
  Toolbox,
  Users,
  Wrench,
  Bolt,
  X,
} from "lucide-react";

import Loader from "@/app/utils/components/Loader";

const MENU = [
  {
    label: "Client",
    listRoute: "/clients/list",
    newRoute: "/clients/new",
    baseRoute: "/clients",
    icon: Users,
  },
  {
    label: "Staff",
    listRoute: "/staff/list",
    newRoute: "/staff/new",
    baseRoute: "/staff",
    icon: CircleUserRound,
  },
  {
    label: "Warehouse",
    listRoute: "/warehouse/list",
    newRoute: "/warehouse/new",
    baseRoute: "/warehouse",
    icon: Building2,
  },
  {
    label: "Material",
    listRoute: "/materials/list",
    newRoute: "/materials/new",
    baseRoute: "/materials",
    icon: Boxes,
  },
  {
    label: "Machineries",
    listRoute: "/machineries/list",
    newRoute: "/machineries/new",
    baseRoute: "/machineries",
    icon: Toolbox,
  },
  {
    label: "Ledger",
    listRoute: "/ledger/list",
    newRoute: "/ledger/new",
    baseRoute: "/ledger",
    icon: BookOpen,
  },
  {
    label: "Project",
    listRoute: "/projects/list",
    newRoute: "/projects/new",
    baseRoute: "/projects",
    icon: FolderKanban,
  },
] as const;

const normalizePath = (path: string) => {
  const clean = (path || "/").split("?")[0].split("#")[0];

  if (clean.length > 1 && clean.endsWith("/")) {
    return clean.slice(0, -1);
  }

  return clean || "/";
};

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onLogout: () => void | Promise<void>;
};

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
  onLogout,
}: SidebarProps) {
  const router = useRouter();
  const pathname = normalizePath(usePathname() || "/");
  const equipmentActive =
    pathname === "/equipments" || pathname.startsWith("/equipments/");

  const [navigating, setNavigating] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(equipmentActive);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (equipmentActive) setAssetsOpen(true);
  }, [equipmentActive]);

  const navigate = (route: string) => {
    if (pathname !== route) {
      setNavigating(true);
    }

    onMobileClose?.();
    router.push(route);
  };

  const renderMenuItem = (item: (typeof MENU)[number]) => {
    const Icon = item.icon;
    const active =
      pathname === item.baseRoute || pathname.startsWith(`${item.baseRoute}/`);

    return (
      <div
        key={item.baseRoute}
        className={`group flex items-center rounded-xl transition-colors ${
          active
            ? "bg-gradient-to-r from-[#103BB5] to-[#3558D4] text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate(item.listRoute)}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left text-[14px] font-medium"
        >
          <Icon size={17} className="shrink-0" />
          <span className="truncate">{item.label}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(item.newRoute)}
          aria-label={`Add ${item.label}`}
          title={`Add ${item.label}`}
          className={`mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
            active
              ? "bg-white/15 text-white hover:bg-white/25"
              : "text-slate-400 hover:bg-white hover:text-[#103BB5]"
          }`}
        >
          <Plus size={16} strokeWidth={2.2} />
        </button>
      </div>
    );
  };

  return (
    <>
      {navigating && <Loader />}

      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onMobileClose}
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 pb-3 shadow-sm transition-transform duration-200 lg:static lg:z-auto lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:translate-x-0 lg:rounded-2xl lg:border ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#103BB5] to-[#4B6FE8] text-sm font-bold text-white shadow-sm">
              S
            </div>
            <h1 className="truncate text-[19px] font-bold tracking-tight text-slate-900">
              Sitebase
            </h1>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <p className="px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Menu
        </p>

        <nav className="flex-1 space-y-0.5 overflow-y-auto text-sm">
          {MENU.slice(0, 4).map(renderMenuItem)}

          <div>
            <button
              type="button"
              onClick={() => setAssetsOpen((current) => !current)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                equipmentActive
                  ? "bg-[#103BB5]/8 text-[#103BB5]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              aria-expanded={assetsOpen}
            >
              <Bolt size={17} className="shrink-0" />
              <span className="flex-1">Assets</span>
              <ChevronDown
                size={15}
                className={`transition-transform duration-150 ${
                  assetsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {assetsOpen && (
              <div className="ml-5 mt-0.5 border-l border-slate-200 pl-2">
                <div
                  className={`group flex items-center rounded-xl transition-colors ${
                    equipmentActive
                      ? "bg-gradient-to-r from-[#103BB5] to-[#3558D4] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => navigate("/equipments/list")}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left text-[13px] font-medium"
                  >
                    <Wrench size={15} className="shrink-0" />
                    <span className="truncate">Equipments</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/equipments/new")}
                    aria-label="Add Equipment"
                    title="Add Equipment"
                    className={`mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      equipmentActive
                        ? "bg-white/15 text-white hover:bg-white/25"
                        : "text-slate-400 hover:bg-white hover:text-[#103BB5]"
                    }`}
                  >
                    <Plus size={15} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {MENU.slice(4).map(renderMenuItem)}
        </nav>

        <div className="mt-2 shrink-0 border-t border-slate-100 pt-2.5">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Settings
          </p>

          <button
            type="button"
            onClick={() => navigate("/settings/user-access")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors ${
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-gradient-to-r from-[#103BB5] to-[#3558D4] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          <div className="mt-1 flex justify-end px-2">
            <span className="text-[10.5px] font-medium text-slate-400">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

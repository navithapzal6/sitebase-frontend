"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearSession, getSession, postAPI } from "@/app/utils/helpers/api";
import Header from "@/app/utils/components/Header";
import Sidebar from "@/app/utils/components/Sidebar";
import { type SessionUser } from "@/app/utils/helpers/permissions";

const getModuleDetails = (pathname: string) => {
  if (pathname === "/clients" || pathname.startsWith("/clients/")) {
    return { title: "Client", module: "clients" as const };
  }
  if (pathname === "/materials" || pathname.startsWith("/materials/")) {
    return { title: "Material", module: "materials" as const };
  }
  if (pathname === "/equipments" || pathname.startsWith("/equipments/")) {
    return { title: "Equipments", module: "equipments" as const };
  }
  if (pathname === "/machineries" || pathname.startsWith("/machineries/")) {
    return { title: "Machineries", module: "machineries" as const };
  }
  if (pathname === "/warehouse" || pathname.startsWith("/warehouse/")) {
    return { title: "Warehouse", module: "warehouse" as const };
  }
  if (pathname === "/ledger" || pathname.startsWith("/ledger/")) {
    return { title: "Ledger", module: "ledger" as const };
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return { title: "Project", module: "projects" as const };
  }
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return { title: "Staff", module: "staff" as const };
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return { title: "Settings", module: "settings" as const };
  }
  return null;
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const moduleDetails = useMemo(() => getModuleDetails(pathname), [pathname]);

  useEffect(() => {
    const storedUser = getSession().user as SessionUser | null;

    if (!storedUser) {
      router.replace("/login");
      setCheckingSession(false);
      return;
    }

    setSessionUser(storedUser);
    setCheckingSession(false);
  }, [router]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await postAPI("LOGOUT");
    } catch (error) {
      console.log(error);
    }

    clearSession();
    router.replace("/login");
  };

  if (checkingSession || !sessionUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#103BB5]/20 border-t-[#103BB5]" />
          <p className="text-sm font-medium text-slate-400">
            Loading Sitebase…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell flex h-screen overflow-hidden bg-[#EEF1F4]">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          title={moduleDetails?.title || "Sitebase"}
          username={sessionUser.username}
          userType={sessionUser.user_type}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-3">
          <div className="site-content h-full min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

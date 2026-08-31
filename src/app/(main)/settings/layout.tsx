import SettingsSidebar from "@/app/utils/components/SettingsSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row">
      <SettingsSidebar />
      <section className="min-h-0 min-w-0 flex-1 overflow-auto bg-white">
        {children}
      </section>
    </div>
  );
}

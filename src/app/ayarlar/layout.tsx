import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AlertMarquee from "@/components/layout/AlertMarquee";

export default function AyarlarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--bg-primary)", transition: "background 0.25s ease" }}>{children}</main>
        <AlertMarquee />
      </div>
    </div>
  );
}

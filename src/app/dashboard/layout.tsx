import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-parchment">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-parchment">{children}</main>
    </div>
  );
}

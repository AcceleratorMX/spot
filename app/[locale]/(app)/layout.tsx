import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

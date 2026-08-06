import { DesktopSidebar, MobileTabs } from "@/components/DashboardSidebar";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <EmailVerificationBanner />
      <MobileTabs />
      <div className="md:flex md:gap-6 md:items-start">
        <DesktopSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

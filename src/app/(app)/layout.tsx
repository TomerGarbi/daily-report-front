import Navbar from "@/components/Navbar";
import { HealthCheckProvider } from "@/components/HealthCheckProvider";
import { PreferencesProvider } from "@/components/PreferencesProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <HealthCheckProvider>
        <Navbar />
        <main>{children}</main>
      </HealthCheckProvider>
    </PreferencesProvider>
  );
}

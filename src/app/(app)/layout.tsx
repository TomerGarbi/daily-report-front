import Navbar from "@/components/Navbar";
import { HealthCheckProvider } from "@/components/HealthCheckProvider";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import { AuthGate } from "@/components/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <HealthCheckProvider>
        <AuthGate>
          <Navbar />
          <main>{children}</main>
        </AuthGate>
      </HealthCheckProvider>
    </PreferencesProvider>
  );
}
